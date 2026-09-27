SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: VatRate_Update — codul e imuabil. Liniile deja adăugate pe consultații /
-- facturi au cota în snapshot, deci nu sunt afectate.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.VatRate_Update
    @Id                  UNIQUEIDENTIFIER,
    @ClinicId            UNIQUEIDENTIFIER,
    @Name                NVARCHAR(150),
    @Percent             DECIMAL(5,2),
    @UblCategoryCode     NVARCHAR(3),
    @ExemptionReasonCode NVARCHAR(30)  = NULL,
    @ExemptionReasonText NVARCHAR(300) = NULL,
    @IsActive            BIT,
    @UpdatedBy           UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @OldValues NVARCHAR(MAX) = (
            SELECT Code, Name, [Percent], UblCategoryCode, ExemptionReasonCode, ExemptionReasonText, IsActive
            FROM dbo.VatRates WITH (UPDLOCK) WHERE Id = @Id
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        IF @OldValues IS NULL
        BEGIN
            ;THROW 50618, N'Regimul TVA nu a fost găsit.', 1;
        END;

        UPDATE dbo.VatRates SET
            Name                = @Name,
            [Percent]           = @Percent,
            UblCategoryCode     = @UblCategoryCode,
            ExemptionReasonCode = @ExemptionReasonCode,
            ExemptionReasonText = @ExemptionReasonText,
            IsActive            = @IsActive,
            UpdatedAt           = GETDATE(),
            UpdatedBy           = @UpdatedBy
        WHERE Id = @Id;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'VatRate', @Id, N'Update', @OldValues,
                (SELECT Code, Name, [Percent], UblCategoryCode, ExemptionReasonCode, ExemptionReasonText, IsActive
                 FROM dbo.VatRates WHERE Id = @Id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
