-- ============================================================================
-- Migrare 0031: Tabele Consultations
-- Descriere: Creare tabel ConsultationStatuses (nomenclator + seed) și Consultations
-- Data: 2026-04-11
-- ============================================================================

SET NOCOUNT ON;
GO

-- ── ConsultationStatuses ─────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConsultationStatuses')
BEGIN
    CREATE TABLE dbo.ConsultationStatuses (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        Name        NVARCHAR(100) NOT NULL,
        Code        NVARCHAR(50)  NOT NULL,
        SortOrder   INT NOT NULL DEFAULT 0,
        IsActive    BIT NOT NULL DEFAULT 1,
        CONSTRAINT PK_ConsultationStatuses PRIMARY KEY (Id),
        CONSTRAINT UQ_ConsultationStatuses_Code UNIQUE (Code)
    );

    -- Seed status-uri fixe (GUID-uri din ConsultationStatusIds.cs)
    INSERT INTO dbo.ConsultationStatuses (Id, Name, Code, SortOrder) VALUES
        ('C2000000-0000-0000-0000-000000000001', N'În lucru',    'INLUCRU',    1),
        ('C2000000-0000-0000-0000-000000000002', N'Finalizată',  'FINALIZATA', 2),
        ('C2000000-0000-0000-0000-000000000003', N'Blocată',     'BLOCATA',    3);

    PRINT 'Tabel ConsultationStatuses creat + seed inserat.';
END
ELSE
    PRINT 'Tabel ConsultationStatuses există deja — ignorat.';
GO

-- ── Consultations ────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Consultations')
BEGIN
    CREATE TABLE dbo.Consultations (
        Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        ClinicId        UNIQUEIDENTIFIER NOT NULL,
        PatientId       UNIQUEIDENTIFIER NOT NULL,
        DoctorId        UNIQUEIDENTIFIER NOT NULL,
        AppointmentId   UNIQUEIDENTIFIER NULL,
        Date            DATETIME2(0)     NOT NULL,
        Motiv           NVARCHAR(4000)   NULL,
        ExamenClinic    NVARCHAR(4000)   NULL,
        Diagnostic      NVARCHAR(4000)   NULL,
        DiagnosticCodes NVARCHAR(MAX)    NULL,
        Recomandari     NVARCHAR(4000)   NULL,
        Observatii      NVARCHAR(4000)   NULL,
        StatusId        UNIQUEIDENTIFIER NOT NULL,
        IsDeleted       BIT              NOT NULL DEFAULT 0,
        CreatedAt       DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),
        CreatedBy       UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt       DATETIME2(0)     NULL,
        UpdatedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_Consultations PRIMARY KEY (Id),
        CONSTRAINT FK_Consultations_Clinics    FOREIGN KEY (ClinicId)      REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_Consultations_Patients   FOREIGN KEY (PatientId)     REFERENCES dbo.Patients(Id),
        CONSTRAINT FK_Consultations_Doctors    FOREIGN KEY (DoctorId)      REFERENCES dbo.Doctors(Id),
        CONSTRAINT FK_Consultations_Appts      FOREIGN KEY (AppointmentId) REFERENCES dbo.Appointments(Id),
        CONSTRAINT FK_Consultations_Statuses   FOREIGN KEY (StatusId)      REFERENCES dbo.ConsultationStatuses(Id)
    );

    CREATE NONCLUSTERED INDEX IX_Consultations_ClinicId_Date
        ON dbo.Consultations (ClinicId, Date DESC) INCLUDE (PatientId, DoctorId, StatusId, IsDeleted);

    CREATE NONCLUSTERED INDEX IX_Consultations_DoctorId_Date
        ON dbo.Consultations (DoctorId, Date DESC) INCLUDE (ClinicId, PatientId, StatusId, IsDeleted);

    CREATE NONCLUSTERED INDEX IX_Consultations_PatientId
        ON dbo.Consultations (PatientId) INCLUDE (ClinicId, DoctorId, Date, StatusId, IsDeleted);

    CREATE NONCLUSTERED INDEX IX_Consultations_AppointmentId
        ON dbo.Consultations (AppointmentId) WHERE AppointmentId IS NOT NULL;

    PRINT 'Tabel Consultations creat.';
END
ELSE
    PRINT 'Tabel Consultations există deja — ignorat.';
GO
