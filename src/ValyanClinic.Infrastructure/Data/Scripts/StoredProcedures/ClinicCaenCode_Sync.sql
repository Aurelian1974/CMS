SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicCaenCode_Sync
-- Descriere: Sincronizare completă coduri CAEN pentru o clinică
--            Șterge toate codurile existente și inserează lista nouă din JSON
-- Parametri:
--   @ClinicId      — ID-ul clinicii
--   @CaenCodesJson — JSON array: [{"caenCodeId":"guid","isPrimary":true}, ...]
--                    Dacă array gol (N'[]') sau NULL → se șterg toate codurile
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicCaenCode_Sync
    @ClinicId      UNIQUEIDENTIFIER,
    @CaenCodesJson NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Șterge toate codurile CAEN existente pentru această clinică
        DELETE FROM ClinicCaenCodes WHERE ClinicId = @ClinicId;

        -- Inserează codurile noi din JSON (dacă lista nu e NULL sau goală)
        IF @CaenCodesJson IS NOT NULL AND @CaenCodesJson <> N'[]'
        BEGIN
            INSERT INTO ClinicCaenCodes (ClinicId, CaenCodeId, IsPrimary)
            SELECT @ClinicId,
                   j.CaenCodeId,
                   ISNULL(j.IsPrimary, 0)
            FROM OPENJSON(@CaenCodesJson)
            WITH (
                CaenCodeId UNIQUEIDENTIFIER '$.caenCodeId',
                IsPrimary  BIT              '$.isPrimary'
            ) j
            WHERE EXISTS (
                SELECT 1 FROM CaenCodes cc
                WHERE cc.Id = j.CaenCodeId AND cc.IsActive = 1
            );
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
