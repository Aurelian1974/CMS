SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Clinic_Create
-- Descriere: Creează o clinică nouă (societate comercială)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Clinic_Create
    @Name                  NVARCHAR(200),
    @FiscalCode            NVARCHAR(20),
    @TradeRegisterNumber   NVARCHAR(30)  = NULL,
    @LegalRepresentative   NVARCHAR(200) = NULL,
    @ContractCNAS          NVARCHAR(50)  = NULL,
    @Address               NVARCHAR(500),
    @City                  NVARCHAR(100),
    @County                NVARCHAR(100),
    @PostalCode            NVARCHAR(10)  = NULL,
    @BankName              NVARCHAR(100) = NULL,
    @BankAccount           NVARCHAR(34)  = NULL,
    @Email                 NVARCHAR(200) = NULL,
    @PhoneNumber           NVARCHAR(20)  = NULL,
    @Website               NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM Clinics WHERE FiscalCode = @FiscalCode)
        BEGIN
            ;THROW 50200, N'O clinică cu acest CUI/CIF există deja.', 1;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO Clinics (Name, FiscalCode, TradeRegisterNumber,
                             LegalRepresentative, ContractCNAS,
                             Address, City, County, PostalCode,
                             BankName, BankAccount,
                             Email, PhoneNumber, Website)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@Name, @FiscalCode, @TradeRegisterNumber,
                @LegalRepresentative, @ContractCNAS,
                @Address, @City, @County, @PostalCode,
                @BankName, @BankAccount,
                @Email, @PhoneNumber, @Website);

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
