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

    -- Result set 1: datele de bază ale clinicii
    SELECT c.Id, c.Name, c.FiscalCode, c.TradeRegisterNumber,
           c.LegalRepresentative, c.ContractCNAS,
           c.LogoPath, c.IsActive, c.CreatedAt, c.UpdatedAt
    FROM dbo.Clinics c
    WHERE c.Id = @Id;

    -- Result set 2: coduri CAEN asociate clinicii
    SELECT ccc.Id,
           ccc.CaenCodeId,
           cc.Code,
           cc.Name,
           cc.Level,
           ccc.IsPrimary
    FROM dbo.ClinicCaenCodes ccc
    INNER JOIN dbo.CaenCodes cc ON cc.Id = ccc.CaenCodeId
    WHERE ccc.ClinicId = @Id
    ORDER BY ccc.IsPrimary DESC, cc.Code;

    -- Result set 3: conturi bancare
    SELECT Id, ClinicId, BankName, Iban, Currency, IsMain, Notes, CreatedAt, UpdatedAt
    FROM dbo.ClinicBankAccounts
    WHERE ClinicId = @Id AND IsDeleted = 0
    ORDER BY IsMain DESC, BankName;

    -- Result set 4: adrese
    SELECT Id, ClinicId, AddressType, Street, City, County, PostalCode, Country, IsMain, CreatedAt, UpdatedAt
    FROM dbo.ClinicAddresses
    WHERE ClinicId = @Id AND IsDeleted = 0
    ORDER BY IsMain DESC, AddressType;

    -- Result set 5: date de contact
    SELECT Id, ClinicId, ContactType, Value, Label, IsMain, CreatedAt, UpdatedAt
    FROM dbo.ClinicContacts
    WHERE ClinicId = @Id AND IsDeleted = 0
    ORDER BY ContactType, IsMain DESC;
END;
GO
