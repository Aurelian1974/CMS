-- ============================================================================
-- MIGRARE 0023: Adăugare tabel ClinicContactPersons
-- ============================================================================
SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ClinicContactPersons')
BEGIN
    CREATE TABLE dbo.ClinicContactPersons
    (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() CONSTRAINT PK_ClinicContactPersons PRIMARY KEY,
        ClinicId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ClinicContactPersons_Clinics REFERENCES dbo.Clinics(Id),
        Name        NVARCHAR(200)    NOT NULL,
        [Function]  NVARCHAR(100)    NULL,
        PhoneNumber NVARCHAR(50)     NULL,
        Email       NVARCHAR(200)    NULL,
        IsMain      BIT              NOT NULL CONSTRAINT DF_ClinicContactPersons_IsMain    DEFAULT 0,
        IsDeleted   BIT              NOT NULL CONSTRAINT DF_ClinicContactPersons_IsDeleted DEFAULT 0,
        CreatedAt   DATETIME2        NOT NULL CONSTRAINT DF_ClinicContactPersons_CreatedAt DEFAULT GETDATE(),
        UpdatedAt   DATETIME2        NULL
    );
    PRINT 'Tabel ClinicContactPersons creat.';
END
ELSE
    PRINT 'Tabel ClinicContactPersons există deja — ignorat.';
GO
