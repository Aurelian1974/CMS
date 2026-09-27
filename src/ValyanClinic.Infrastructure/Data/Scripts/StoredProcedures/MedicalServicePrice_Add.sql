SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: MedicalServicePrice_Add — versiune nouă de preț.
-- Reguli:
--   * @ValidFrom nu poate fi în trecut (istoricul intrat în vigoare e imuabil);
--   * trebuie să fie ulterioară ultimei versiuni — versiunea anterioară se închide
--     automat (ValidTo = @ValidFrom);
--   * aceeași dată cu ultima versiune (azi sau în viitor) = corecție pe acea versiune.
-- Liniile deja adăugate pe consultații au prețul în snapshot și nu sunt afectate.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalServicePrice_Add
    @ClinicId         UNIQUEIDENTIFIER,
    @MedicalServiceId UNIQUEIDENTIFIER,
    @Price            DECIMAL(18,2),
    @VatRateId        UNIQUEIDENTIFIER,
    @ValidFrom        DATE,
    @CreatedBy        UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Today DATE = CAST(GETDATE() AS DATE);

        -- Lock pe serviciu: versiunile aceluiași serviciu se adaugă serializat
        IF NOT EXISTS (SELECT 1 FROM dbo.MedicalServices WITH (UPDLOCK, HOLDLOCK)
                       WHERE Id = @MedicalServiceId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50611, N'Serviciul nu a fost găsit.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.VatRates WHERE Id = @VatRateId AND IsActive = 1)
        BEGIN
            ;THROW 50616, N'Regimul TVA selectat nu este valid.', 1;
        END;

        IF @ValidFrom < @Today
        BEGIN
            ;THROW 50614, N'Data de la care se aplică prețul nu poate fi în trecut.', 1;
        END;

        DECLARE @LatestId UNIQUEIDENTIFIER, @LatestFrom DATE, @OldValues NVARCHAR(MAX);
        SELECT TOP (1) @LatestId = Id, @LatestFrom = ValidFrom
        FROM dbo.MedicalServicePrices
        WHERE MedicalServiceId = @MedicalServiceId
        ORDER BY ValidFrom DESC;

        IF @LatestFrom IS NOT NULL AND @ValidFrom < @LatestFrom
        BEGIN
            DECLARE @Msg NVARCHAR(300) = CONCAT(
                N'Există deja o versiune de preț care începe la ', FORMAT(@LatestFrom, 'dd.MM.yyyy'),
                N'. Alegeți o dată ulterioară.');
            ;THROW 50614, @Msg, 1;
        END;

        DECLARE @PriceId UNIQUEIDENTIFIER;

        IF @LatestFrom = @ValidFrom
        BEGIN
            SET @OldValues = (SELECT Price, VatRateId, ValidFrom FROM dbo.MedicalServicePrices
                              WHERE Id = @LatestId FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

            UPDATE dbo.MedicalServicePrices
            SET Price = @Price, VatRateId = @VatRateId
            WHERE Id = @LatestId;

            SET @PriceId = @LatestId;
        END
        ELSE
        BEGIN
            UPDATE dbo.MedicalServicePrices
            SET ValidTo = @ValidFrom
            WHERE MedicalServiceId = @MedicalServiceId AND ValidTo IS NULL;

            SET @PriceId = NEWID();
            INSERT INTO dbo.MedicalServicePrices (Id, ClinicId, MedicalServiceId, Price, VatRateId, ValidFrom, ValidTo, CreatedAt, CreatedBy)
            VALUES (@PriceId, @ClinicId, @MedicalServiceId, @Price, @VatRateId, @ValidFrom, NULL, GETDATE(), @CreatedBy);
        END;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'MedicalServicePrice', @MedicalServiceId,
                CASE WHEN @OldValues IS NULL THEN N'Create' ELSE N'Update' END,
                @OldValues,
                (SELECT @PriceId AS PriceId, @Price AS Price, @VatRateId AS VatRateId, @ValidFrom AS ValidFrom
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @CreatedBy);

        COMMIT TRANSACTION;
        SELECT @PriceId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
