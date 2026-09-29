SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: MedicalService_Create — serviciu nou + prima versiune de preț
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalService_Create
    @ClinicId              UNIQUEIDENTIFIER,
    @Code                  NVARCHAR(30),
    @Name                  NVARCHAR(200),
    @CategoryId            UNIQUEIDENTIFIER,
    @DurationMinutes       INT              = NULL,
    @InvestigationTypeCode NVARCHAR(50)     = NULL,
    @Price                 DECIMAL(18,2),
    @VatRateId             UNIQUEIDENTIFIER,
    @ValidFrom             DATE             = NULL,
    @CreatedBy             UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Today DATE = CAST(GETDATE() AS DATE);
        SET @ValidFrom = ISNULL(@ValidFrom, @Today);

        IF EXISTS (SELECT 1 FROM dbo.MedicalServices WITH (UPDLOCK, HOLDLOCK)
                   WHERE ClinicId = @ClinicId AND Code = @Code AND IsDeleted = 0)
        BEGIN
            ;THROW 50610, N'Există deja un serviciu cu acest cod.', 1;
        END;

        IF @InvestigationTypeCode IS NOT NULL AND EXISTS (
            SELECT 1 FROM dbo.MedicalServices WITH (UPDLOCK, HOLDLOCK)
            WHERE ClinicId = @ClinicId AND InvestigationTypeCode = @InvestigationTypeCode AND IsDeleted = 0)
        BEGIN
            ;THROW 50651, N'Investigația asociată are deja un serviciu în tarife.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.ServiceCategories WHERE Id = @CategoryId AND IsActive = 1)
        BEGIN
            ;THROW 50615, N'Categoria selectată nu este validă.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.VatRates WHERE Id = @VatRateId AND IsActive = 1)
        BEGIN
            ;THROW 50616, N'Regimul TVA selectat nu este valid.', 1;
        END;

        IF @ValidFrom < @Today
        BEGIN
            ;THROW 50614, N'Data de la care se aplică prețul nu poate fi în trecut.', 1;
        END;

        DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

        INSERT INTO dbo.MedicalServices
            (Id, ClinicId, Code, Name, CategoryId, DurationMinutes, InvestigationTypeCode, IsActive, CreatedAt, CreatedBy)
        VALUES
            (@NewId, @ClinicId, @Code, @Name, @CategoryId, @DurationMinutes, @InvestigationTypeCode, 1, GETDATE(), @CreatedBy);

        INSERT INTO dbo.MedicalServicePrices (ClinicId, MedicalServiceId, Price, VatRateId, ValidFrom, ValidTo, CreatedAt, CreatedBy)
        VALUES (@ClinicId, @NewId, @Price, @VatRateId, @ValidFrom, NULL, GETDATE(), @CreatedBy);

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'MedicalService', @NewId, N'Create', NULL,
                (SELECT @Code AS Code, @Name AS Name, @CategoryId AS CategoryId, @DurationMinutes AS DurationMinutes,
                        @Price AS Price, @VatRateId AS VatRateId, @ValidFrom AS ValidFrom
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
