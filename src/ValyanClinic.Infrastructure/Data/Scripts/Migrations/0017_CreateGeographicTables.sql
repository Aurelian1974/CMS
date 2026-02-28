-- ============================================================================
-- Migrare: 0017_CreateGeographicTables.sql
-- Descriere: Creare tabele geografice — LocationTypes, Counties, Localities
--            (date importate din ValyanMed: TipLocalitate, Judet, Localitate)
-- Data: 2026-02-28
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ==================== TABEL LOCATION TYPES (tip localitate) ====================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'LocationTypes')
BEGIN
    CREATE TABLE LocationTypes (
        Id         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Code       NVARCHAR(10)     NOT NULL,    -- Cod prescurtat: 'Loc', 'Mun', 'Ors', 'Sat', 'Sec', 'Com', 'MRJ'
        Name       NVARCHAR(100)    NOT NULL,    -- Denumire: 'Localitate', 'Municipiu', 'Oras' etc.
        IsActive   BIT              NOT NULL DEFAULT 1,

        CONSTRAINT UQ_LocationTypes_Code UNIQUE (Code)
    );
END;
GO

-- ==================== TABEL COUNTIES (judete) ====================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Counties')
BEGIN
    CREATE TABLE Counties (
        Id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name          NVARCHAR(50)     NOT NULL,    -- Denumire judet (ex: 'Bucuresti', 'Cluj')
        Abbreviation  NVARCHAR(5)      NOT NULL,    -- Prescurtare (ex: 'B', 'CJ')
        AutoCode      NVARCHAR(5)      NULL,        -- Cod auto (ex: 'B', 'CJ')
        SortOrder     INT              NULL,         -- Ordine afisare
        IsActive      BIT              NOT NULL DEFAULT 1,

        CONSTRAINT UQ_Counties_Name UNIQUE (Name),
        CONSTRAINT UQ_Counties_Abbreviation UNIQUE (Abbreviation)
    );
END;
GO

-- ==================== TABEL LOCALITIES (localitati) ====================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Localities')
BEGIN
    CREATE TABLE Localities (
        Id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        CountyId         UNIQUEIDENTIFIER NOT NULL,       -- FK → Counties
        Name             NVARCHAR(100)    NOT NULL,       -- Denumire localitate
        SirutaCode       INT              NOT NULL,       -- Cod SIRUTA (cod unic localitate Romania)
        LocationTypeId   UNIQUEIDENTIFIER NULL,           -- FK → LocationTypes (municipiu, oras, sat etc.)
        LocalityCode     NVARCHAR(10)     NOT NULL,       -- Cod localitate
        IsActive         BIT              NOT NULL DEFAULT 1,

        CONSTRAINT FK_Localities_Counties       FOREIGN KEY (CountyId)       REFERENCES Counties(Id),
        CONSTRAINT FK_Localities_LocationTypes  FOREIGN KEY (LocationTypeId) REFERENCES LocationTypes(Id)
    );
END;
GO

-- ==================== INDEXURI ====================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Localities_CountyId' AND object_id = OBJECT_ID('Localities'))
    CREATE INDEX IX_Localities_CountyId ON Localities(CountyId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Localities_LocationTypeId' AND object_id = OBJECT_ID('Localities'))
    CREATE INDEX IX_Localities_LocationTypeId ON Localities(LocationTypeId) WHERE LocationTypeId IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Localities_Name' AND object_id = OBJECT_ID('Localities'))
    CREATE INDEX IX_Localities_Name ON Localities(Name);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Counties_Name' AND object_id = OBJECT_ID('Counties'))
    CREATE INDEX IX_Counties_Name ON Counties(Name);
GO
