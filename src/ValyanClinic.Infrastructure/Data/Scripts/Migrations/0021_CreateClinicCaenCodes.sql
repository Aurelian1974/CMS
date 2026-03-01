-- ============================================================================
-- Migrare 0021: Creare tabel ClinicCaenCodes
-- Descriere: Relație multi-value între clinici și coduri CAEN (un to many)
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ClinicCaenCodes')
BEGIN
    CREATE TABLE ClinicCaenCodes (
        Id         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId   UNIQUEIDENTIFIER NOT NULL,
        CaenCodeId UNIQUEIDENTIFIER NOT NULL,
        IsPrimary  BIT              NOT NULL DEFAULT 0,   -- primul cod CAEN adăugat = principal
        CreatedAt  DATETIME2        NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_ClinicCaenCodes_Clinics   FOREIGN KEY (ClinicId)   REFERENCES Clinics(Id),
        CONSTRAINT FK_ClinicCaenCodes_CaenCodes FOREIGN KEY (CaenCodeId) REFERENCES CaenCodes(Id),
        CONSTRAINT UQ_ClinicCaenCodes           UNIQUE (ClinicId, CaenCodeId)
    );

    CREATE INDEX IX_ClinicCaenCodes_ClinicId   ON ClinicCaenCodes (ClinicId);
    CREATE INDEX IX_ClinicCaenCodes_CaenCodeId ON ClinicCaenCodes (CaenCodeId);

    PRINT '0021 OK — tabel ClinicCaenCodes creat.';
END
ELSE
BEGIN
    PRINT '0021 SKIP — tabel ClinicCaenCodes există deja.';
END;
GO
