SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ConsultationService_SyncFromInvestigations
-- Aliniază liniile de servicii ale consultației cu investigațiile paraclinice:
--   - investigație efectuată (Status = 2), internă, cu serviciu activ și preț în vigoare
--     → linie cu prețul copiat (snapshot), legată prin ConsultationInvestigationId;
--   - investigație ștearsă / externă / neefectuată → linia legată se elimină.
-- Investigațiile fără tarif nu blochează nimic — rămân „nefacturate”
-- (vezi ConsultationService_GetUnbilledInvestigations).
-- Apelat din Investigation_Create/Update/Delete, Consultation_Finalize și manual
-- (recepție / medic). Nu deschide tranzacție proprie dacă rulează într-una existentă
-- și nu întoarce result set (apelantul poate returna propriul rezultat).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationService_SyncFromInvestigations
    @ClinicId       UNIQUEIDENTIFIER,
    @ConsultationId UNIQUEIDENTIFIER,
    @UserId         UNIQUEIDENTIFIER,
    @AddedCount     INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CompletedStatus TINYINT = 2;
    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;

    BEGIN TRY
        IF @OwnTran = 1 BEGIN TRANSACTION;

        DECLARE @StatusCode NVARCHAR(50);

        -- UPDLOCK pe consultație: serializează cu emiterea documentelor fiscale
        SELECT @StatusCode = s.Code
        FROM dbo.Consultations c WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

        IF @StatusCode IS NULL
        BEGIN
            ;THROW 50020, N'Consultația nu a fost găsită.', 1;
        END;

        IF @StatusCode NOT IN (N'INLUCRU', N'FINALIZATA')
        BEGIN
            ;THROW 50601, N'Consultația a fost facturată sau blocată; serviciile nu mai pot fi modificate. Corecțiile se fac prin storno.', 1;
        END;

        DECLARE @Today DATE = CAST(GETDATE() AS DATE);
        DECLARE @Removed TABLE (Id UNIQUEIDENTIFIER, ConsultationInvestigationId UNIQUEIDENTIFIER, ServiceCode NVARCHAR(30), UnitPrice DECIMAL(18,2));
        DECLARE @Added   TABLE (Id UNIQUEIDENTIFIER, ConsultationInvestigationId UNIQUEIDENTIFIER, MedicalServiceId UNIQUEIDENTIFIER,
                                ServiceCode NVARCHAR(30), UnitPrice DECIMAL(18,2), VatRateId UNIQUEIDENTIFIER);

        UPDATE cs
        SET IsDeleted = 1, UpdatedAt = GETDATE(), UpdatedBy = @UserId
        OUTPUT inserted.Id, inserted.ConsultationInvestigationId, inserted.ServiceCode, inserted.UnitPrice INTO @Removed
        FROM dbo.ConsultationServices cs
        INNER JOIN dbo.ConsultationInvestigations ci ON ci.Id = cs.ConsultationInvestigationId
        WHERE cs.ConsultationId = @ConsultationId
          AND cs.ClinicId = @ClinicId
          AND cs.IsDeleted = 0
          AND (ci.IsDeleted = 1 OR ci.IsExternal = 1 OR ci.Status <> @CompletedStatus);

        DECLARE @MaxSort INT = ISNULL((
            SELECT MAX(SortOrder) FROM dbo.ConsultationServices
            WHERE ConsultationId = @ConsultationId AND IsDeleted = 0), 0);

        INSERT INTO dbo.ConsultationServices
            (Id, ClinicId, ConsultationId, MedicalServiceId, ConsultationInvestigationId, ServiceCode, ServiceName,
             UnitPrice, Quantity, VatRateId, VatPercent, VatCategoryCode, SortOrder, CreatedAt, CreatedBy)
        OUTPUT inserted.Id, inserted.ConsultationInvestigationId, inserted.MedicalServiceId,
               inserted.ServiceCode, inserted.UnitPrice, inserted.VatRateId INTO @Added
        SELECT
            NEWID(), @ClinicId, @ConsultationId, ms.Id, ci.Id, ms.Code, ms.Name,
            p.Price, 1, p.VatRateId, v.[Percent], v.UblCategoryCode,
            @MaxSort + ROW_NUMBER() OVER (ORDER BY ci.InvestigationDate, ci.CreatedAt),
            GETDATE(), @UserId
        FROM dbo.ConsultationInvestigations ci
        INNER JOIN dbo.MedicalServices ms
                ON ms.ClinicId = @ClinicId
               AND ms.InvestigationTypeCode = ci.InvestigationType
               AND ms.IsDeleted = 0
               AND ms.IsActive = 1
        CROSS APPLY (
            SELECT TOP (1) mp.Price, mp.VatRateId
            FROM dbo.MedicalServicePrices mp
            WHERE mp.MedicalServiceId = ms.Id AND mp.ValidFrom <= @Today
              AND (mp.ValidTo IS NULL OR mp.ValidTo > @Today)
            ORDER BY mp.ValidFrom DESC
        ) p
        INNER JOIN dbo.VatRates v ON v.Id = p.VatRateId
        WHERE ci.ConsultationId = @ConsultationId
          AND ci.ClinicId = @ClinicId
          AND ci.IsDeleted = 0
          AND ci.IsExternal = 0
          AND ci.Status = @CompletedStatus
          AND NOT EXISTS (
              SELECT 1 FROM dbo.ConsultationServices x
              WHERE x.ConsultationInvestigationId = ci.Id AND x.IsDeleted = 0);

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        SELECT @ClinicId, N'ConsultationService', r.Id, N'Delete',
               (SELECT @ConsultationId AS ConsultationId, r.ConsultationInvestigationId AS ConsultationInvestigationId,
                       r.ServiceCode AS ServiceCode, r.UnitPrice AS UnitPrice
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
               NULL, @UserId
        FROM @Removed r;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        SELECT @ClinicId, N'ConsultationService', a.Id, N'Create', NULL,
               (SELECT @ConsultationId AS ConsultationId, a.ConsultationInvestigationId AS ConsultationInvestigationId,
                       a.MedicalServiceId AS MedicalServiceId, a.ServiceCode AS ServiceCode,
                       a.UnitPrice AS UnitPrice, 1 AS Quantity, a.VatRateId AS VatRateId
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
               @UserId
        FROM @Added a;

        SET @AddedCount = (SELECT COUNT(*) FROM @Added);

        IF @OwnTran = 1 COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @OwnTran = 1 AND @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
