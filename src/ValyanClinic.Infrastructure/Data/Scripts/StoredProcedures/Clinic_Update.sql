SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Clinic_Update
-- Descriere: Actualizare date clinică (societate comercială)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Clinic_Update
    @Id                    UNIQUEIDENTIFIER,
    @Name                  NVARCHAR(200),
    @FiscalCode            NVARCHAR(20),
    @TradeRegisterNumber   NVARCHAR(30)  = NULL,
    @LegalRepresentative   NVARCHAR(200) = NULL,
    @ContractCNAS          NVARCHAR(50)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Clinics WHERE Id = @Id)
        BEGIN
            ;THROW 50201, N'Clinica nu a fost găsită.', 1;
        END;

        IF EXISTS (SELECT 1 FROM Clinics WHERE FiscalCode = @FiscalCode AND Id <> @Id)
        BEGIN
            ;THROW 50200, N'O clinică cu acest CUI/CIF există deja.', 1;
        END;

        UPDATE Clinics
        SET Name                = @Name,
            FiscalCode          = @FiscalCode,
            TradeRegisterNumber = @TradeRegisterNumber,
            LegalRepresentative = @LegalRepresentative,
            ContractCNAS        = @ContractCNAS,
            UpdatedAt           = GETDATE()
        WHERE Id = @Id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
