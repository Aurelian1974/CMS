SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ConsultationService_Add — adaugă un serviciu din nomenclator pe consultație.
-- Prețul și cota TVA se copiază ca SNAPSHOT din versiunea în vigoare azi.
-- Permis doar pe consultații în lucru sau finalizate, înainte de primul document fiscal.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationService_Add
    @ClinicId         UNIQUEIDENTIFIER,
    @ConsultationId   UNIQUEIDENTIFIER,
    @MedicalServiceId UNIQUEIDENTIFIER,
    @Quantity         DECIMAL(10,3) = 1,
    @CreatedBy        UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Today DATE = CAST(GETDATE() AS DATE);
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

        IF @Quantity IS NULL OR @Quantity <= 0
        BEGIN
            ;THROW 50603, N'Cantitatea trebuie să fie mai mare decât zero.', 1;
        END;

        DECLARE @Code NVARCHAR(30), @Name NVARCHAR(200), @Price DECIMAL(18,2),
                @VatRateId UNIQUEIDENTIFIER, @VatPercent DECIMAL(5,2), @VatCategory NVARCHAR(3);

        SELECT TOP (1)
            @Code = ms.Code, @Name = ms.Name, @Price = p.Price,
            @VatRateId = p.VatRateId, @VatPercent = v.[Percent], @VatCategory = v.UblCategoryCode
        FROM dbo.MedicalServices ms
        INNER JOIN dbo.MedicalServicePrices p ON p.MedicalServiceId = ms.Id
        INNER JOIN dbo.VatRates v ON v.Id = p.VatRateId
        WHERE ms.Id = @MedicalServiceId AND ms.ClinicId = @ClinicId
          AND ms.IsDeleted = 0 AND ms.IsActive = 1
          AND p.ValidFrom <= @Today AND (p.ValidTo IS NULL OR p.ValidTo > @Today)
        ORDER BY p.ValidFrom DESC;

        IF @Code IS NULL
        BEGIN
            ;THROW 50612, N'Serviciul nu este activ sau nu are un preț în vigoare.', 1;
        END;

        DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
        DECLARE @SortOrder INT = ISNULL((
            SELECT MAX(SortOrder) FROM dbo.ConsultationServices
            WHERE ConsultationId = @ConsultationId AND IsDeleted = 0), 0) + 1;

        INSERT INTO dbo.ConsultationServices
            (Id, ClinicId, ConsultationId, MedicalServiceId, ServiceCode, ServiceName, UnitPrice, Quantity,
             VatRateId, VatPercent, VatCategoryCode, SortOrder, CreatedAt, CreatedBy)
        VALUES
            (@NewId, @ClinicId, @ConsultationId, @MedicalServiceId, @Code, @Name, @Price, @Quantity,
             @VatRateId, @VatPercent, @VatCategory, @SortOrder, GETDATE(), @CreatedBy);

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'ConsultationService', @NewId, N'Create', NULL,
                (SELECT @ConsultationId AS ConsultationId, @MedicalServiceId AS MedicalServiceId, @Code AS ServiceCode,
                        @Price AS UnitPrice, @Quantity AS Quantity, @VatRateId AS VatRateId
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @CreatedBy);

        COMMIT TRANSACTION;
        SELECT @NewId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
