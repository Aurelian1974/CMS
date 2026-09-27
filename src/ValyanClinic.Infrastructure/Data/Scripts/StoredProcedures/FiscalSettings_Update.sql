SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: FiscalSettings_Update — setări + mapări (înlocuiește complet mapările)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.FiscalSettings_Update
    @ClinicId        UNIQUEIDENTIFIER,
    @IsEnabled       BIT,
    @BridgeUrl       NVARCHAR(200),
    @IsVatPayer      BIT,
    @VatMappings     dbo.FiscalVatMappingTableType READONLY,
    @PaymentMappings dbo.FiscalPaymentMappingTableType READONLY,
    @UpdatedBy       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @OldValues NVARCHAR(MAX) = (
            SELECT
                (SELECT IsEnabled, BridgeUrl FROM dbo.FiscalSettings WHERE ClinicId = @ClinicId
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS Settings,
                (SELECT IsVatPayer FROM dbo.Clinics WHERE Id = @ClinicId) AS IsVatPayer,
                (SELECT VatRateId, TaxGroup FROM dbo.FiscalVatMappings WHERE ClinicId = @ClinicId FOR JSON PATH) AS VatMappings,
                (SELECT PaymentMethodId, DevicePaymentCode FROM dbo.FiscalPaymentMappings WHERE ClinicId = @ClinicId
                 FOR JSON PATH) AS PaymentMappings
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        MERGE dbo.FiscalSettings WITH (HOLDLOCK) AS t
        USING (SELECT @ClinicId AS ClinicId) AS s ON t.ClinicId = s.ClinicId
        WHEN MATCHED THEN UPDATE SET
            IsEnabled = @IsEnabled, BridgeUrl = @BridgeUrl, UpdatedAt = GETDATE(), UpdatedBy = @UpdatedBy
        WHEN NOT MATCHED THEN INSERT (ClinicId, IsEnabled, BridgeUrl, UpdatedAt, UpdatedBy)
            VALUES (@ClinicId, @IsEnabled, @BridgeUrl, GETDATE(), @UpdatedBy);

        UPDATE dbo.Clinics SET IsVatPayer = @IsVatPayer, UpdatedAt = GETDATE() WHERE Id = @ClinicId;

        IF EXISTS (SELECT 1 FROM @VatMappings vm
                   LEFT JOIN dbo.VatRates v ON v.Id = vm.VatRateId WHERE v.Id IS NULL)
        BEGIN
            ;THROW 50616, N'Regimul TVA din mapare nu este valid.', 1;
        END;

        IF EXISTS (SELECT 1 FROM @PaymentMappings pm
                   LEFT JOIN dbo.PaymentMethods m ON m.Id = pm.PaymentMethodId WHERE m.Id IS NULL)
        BEGIN
            ;THROW 50635, N'Metoda de plată din mapare nu este validă.', 1;
        END;

        DELETE FROM dbo.FiscalVatMappings WHERE ClinicId = @ClinicId;
        INSERT INTO dbo.FiscalVatMappings (ClinicId, VatRateId, TaxGroup)
        SELECT @ClinicId, VatRateId, LTRIM(RTRIM(TaxGroup))
        FROM @VatMappings WHERE NULLIF(LTRIM(RTRIM(TaxGroup)), N'') IS NOT NULL;

        DELETE FROM dbo.FiscalPaymentMappings WHERE ClinicId = @ClinicId;
        INSERT INTO dbo.FiscalPaymentMappings (ClinicId, PaymentMethodId, DevicePaymentCode)
        SELECT @ClinicId, PaymentMethodId, LTRIM(RTRIM(DevicePaymentCode))
        FROM @PaymentMappings WHERE NULLIF(LTRIM(RTRIM(DevicePaymentCode)), N'') IS NOT NULL;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'FiscalSettings', @ClinicId, N'Update', @OldValues,
                (SELECT
                    (SELECT @IsEnabled AS IsEnabled, @BridgeUrl AS BridgeUrl FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS Settings,
                    @IsVatPayer AS IsVatPayer,
                    (SELECT VatRateId, TaxGroup FROM dbo.FiscalVatMappings WHERE ClinicId = @ClinicId FOR JSON PATH) AS VatMappings,
                    (SELECT PaymentMethodId, DevicePaymentCode FROM dbo.FiscalPaymentMappings WHERE ClinicId = @ClinicId
                     FOR JSON PATH) AS PaymentMappings
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
