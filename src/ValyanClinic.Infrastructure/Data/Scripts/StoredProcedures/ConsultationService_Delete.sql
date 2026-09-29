SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ConsultationService_Delete — soft delete al unei linii, înainte de facturare
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationService_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @ConsultationId UNIQUEIDENTIFIER, @StatusCode NVARCHAR(50), @InvestigationId UNIQUEIDENTIFIER;

        SELECT @ConsultationId = ConsultationId, @InvestigationId = ConsultationInvestigationId
        FROM dbo.ConsultationServices
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        IF @ConsultationId IS NULL
        BEGIN
            ;THROW 50604, N'Linia de serviciu nu a fost găsită.', 1;
        END;

        IF @InvestigationId IS NOT NULL
        BEGIN
            ;THROW 50605, N'Linia provine dintr-o investigație paraclinică și se elimină odată cu investigația (tab-ul Investigații).', 1;
        END;

        SELECT @StatusCode = s.Code
        FROM dbo.Consultations c WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

        IF @StatusCode IS NULL OR @StatusCode NOT IN (N'INLUCRU', N'FINALIZATA')
        BEGIN
            ;THROW 50601, N'Consultația a fost facturată sau blocată; serviciile nu mai pot fi modificate. Corecțiile se fac prin storno.', 1;
        END;

        DECLARE @OldValues NVARCHAR(MAX) = (
            SELECT ConsultationId, MedicalServiceId, ServiceCode, UnitPrice, Quantity, LineTotal
            FROM dbo.ConsultationServices WHERE Id = @Id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        UPDATE dbo.ConsultationServices
        SET IsDeleted = 1, UpdatedAt = GETDATE(), UpdatedBy = @DeletedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'ConsultationService', @Id, N'Delete', @OldValues, NULL, @DeletedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
