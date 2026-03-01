-- Migrare 0019: Creare tabel CaenCodes
-- Sursa date: ONRC (https://www.onrc.ro/index.php/ro/caen-index)

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CaenCodes')
BEGIN
    CREATE TABLE CaenCodes (
        Id         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Code       NVARCHAR(7)      NOT NULL,
        Name       NVARCHAR(500)    NOT NULL,
        -- Nivel ierarhic: 1=Sectiune (A-U), 2=Diviziune (2 cifre), 3=Grupa (3 cifre), 4=Clasa (4 cifre)
        Level      TINYINT          NOT NULL,
        IsActive   BIT              NOT NULL DEFAULT 1,
        CONSTRAINT UQ_CaenCodes_Code UNIQUE (Code)
    );

    CREATE INDEX IX_CaenCodes_Code  ON CaenCodes (Code);
    CREATE INDEX IX_CaenCodes_Level ON CaenCodes (Level);
END;
GO
