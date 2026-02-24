SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Clinic_GetById
-- Descriere: Returnează datele unei clinici după Id
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Clinic_GetById
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT c.Id, c.Name, c.FiscalCode, c.TradeRegisterNumber, c.CaenCode,
           c.LegalRepresentative, c.ContractCNAS,
           c.Address, c.City, c.County, c.PostalCode,
           c.BankName, c.BankAccount,
           c.Email, c.PhoneNumber, c.Website, c.LogoPath,
           c.IsActive, c.CreatedAt, c.UpdatedAt
    FROM Clinics c
    WHERE c.Id = @Id;
END;
GO
