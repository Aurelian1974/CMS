-- ============================================================================
-- Migrare: 0002_CreateClinicsAndLocations.sql
-- Descriere: Creare tabele Clinics (societate comercială) și ClinicLocations
--            (locații fizice / puncte de lucru ale clinicii)
-- Data: 2026-02-24
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ==================== TABEL CLINICS (societate comerciala) ====================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Clinics')
BEGIN
    CREATE TABLE Clinics (
        Id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name                  NVARCHAR(200)    NOT NULL,   -- Denumire societate (ex: 'Clinica Valyan SRL')
        FiscalCode            NVARCHAR(20)     NOT NULL,   -- CUI / CIF (cod unic identificare fiscală)
        TradeRegisterNumber   NVARCHAR(30)     NULL,       -- Nr. Registrul Comerțului (ex: J40/1234/2020)
        CaenCode              NVARCHAR(10)     NULL,       -- Cod CAEN principal (ex: 8622)
        LegalRepresentative   NVARCHAR(200)    NULL,       -- Numele reprezentantului legal
        ContractCNAS          NVARCHAR(50)     NULL,       -- Număr contract CNAS
        Address               NVARCHAR(500)    NOT NULL,   -- Adresa sediului social
        City                  NVARCHAR(100)    NOT NULL,   -- Oraș
        County                NVARCHAR(100)    NOT NULL,   -- Județ
        PostalCode            NVARCHAR(10)     NULL,       -- Cod poștal
        BankName              NVARCHAR(100)    NULL,       -- Banca
        BankAccount           NVARCHAR(34)     NULL,       -- IBAN (max 34 caractere)
        Email                 NVARCHAR(200)    NULL,       -- Email contact societate
        PhoneNumber           NVARCHAR(20)     NULL,       -- Telefon contact societate
        Website               NVARCHAR(200)    NULL,       -- Website
        LogoPath              NVARCHAR(500)    NULL,       -- Cale logo (pentru antet PDF-uri)
        IsActive              BIT              NOT NULL DEFAULT 1,
        CreatedAt             DATETIME2        NOT NULL DEFAULT GETDATE(),
        UpdatedAt             DATETIME2        NULL,

        CONSTRAINT UQ_Clinics_FiscalCode UNIQUE (FiscalCode)
    );
END;
GO

-- ==================== TABEL CLINIC LOCATIONS (locatii fizice) ====================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ClinicLocations')
BEGIN
    CREATE TABLE ClinicLocations (
        Id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId      UNIQUEIDENTIFIER NOT NULL,
        Name          NVARCHAR(200)    NOT NULL,   -- Denumire locație (ex: 'Sediu Central', 'Punct de lucru Sector 3')
        Address       NVARCHAR(500)    NOT NULL,   -- Adresa completă
        City          NVARCHAR(100)    NOT NULL,   -- Oraș
        County        NVARCHAR(100)    NOT NULL,   -- Județ
        PostalCode    NVARCHAR(10)     NULL,        -- Cod poștal
        PhoneNumber   NVARCHAR(20)     NULL,        -- Telefon locație
        Email         NVARCHAR(200)    NULL,        -- Email locație
        IsPrimary     BIT              NOT NULL DEFAULT 0,   -- Sediu social / locație principală
        IsActive      BIT              NOT NULL DEFAULT 1,
        IsDeleted     BIT              NOT NULL DEFAULT 0,
        CreatedAt     DATETIME2        NOT NULL DEFAULT GETDATE(),
        UpdatedAt     DATETIME2        NULL,

        CONSTRAINT FK_ClinicLocations_Clinics FOREIGN KEY (ClinicId) REFERENCES Clinics(Id)
    );
END;
GO

-- ==================== INDEXURI ====================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ClinicLocations_ClinicId' AND object_id = OBJECT_ID('ClinicLocations'))
    CREATE INDEX IX_ClinicLocations_ClinicId ON ClinicLocations(ClinicId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ClinicLocations_IsPrimary' AND object_id = OBJECT_ID('ClinicLocations'))
    CREATE INDEX IX_ClinicLocations_IsPrimary ON ClinicLocations(ClinicId, IsPrimary) WHERE IsPrimary = 1 AND IsDeleted = 0;
GO
