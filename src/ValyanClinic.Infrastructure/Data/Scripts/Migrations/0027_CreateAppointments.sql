-- ============================================================================
-- Migrare 0027: Tabele Appointments
-- Descriere: Creare tabel AppointmentStatuses (nomenclator + seed) și Appointments
-- Data: 2026-03-28
-- ============================================================================

SET NOCOUNT ON;
GO

-- ── AppointmentStatuses ──────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AppointmentStatuses')
BEGIN
    CREATE TABLE dbo.AppointmentStatuses (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        Name        NVARCHAR(100) NOT NULL,
        Code        NVARCHAR(50)  NOT NULL,
        SortOrder   INT NOT NULL DEFAULT 0,
        IsActive    BIT NOT NULL DEFAULT 1,
        CONSTRAINT PK_AppointmentStatuses PRIMARY KEY (Id),
        CONSTRAINT UQ_AppointmentStatuses_Code UNIQUE (Code)
    );

    -- Seed status-uri fixe (GUID-uri din AppointmentStatusIds.cs)
    INSERT INTO dbo.AppointmentStatuses (Id, Name, Code, SortOrder) VALUES
        ('A1000000-0000-0000-0000-000000000001', N'Programat',    'PROGRAMAT',    1),
        ('A1000000-0000-0000-0000-000000000002', N'Confirmat',    'CONFIRMAT',    2),
        ('A1000000-0000-0000-0000-000000000003', N'Finalizat',    'FINALIZAT',    3),
        ('A1000000-0000-0000-0000-000000000004', N'Anulat',       'ANULAT',       4),
        ('A1000000-0000-0000-0000-000000000005', N'Neprezentare', 'NEPREZENTARE', 5);

    PRINT 'Tabel AppointmentStatuses creat + seed inserat.';
END
ELSE
    PRINT 'Tabel AppointmentStatuses există deja — ignorat.';
GO

-- ── Appointments ─────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Appointments')
BEGIN
    CREATE TABLE dbo.Appointments (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        ClinicId    UNIQUEIDENTIFIER NOT NULL,
        PatientId   UNIQUEIDENTIFIER NOT NULL,
        DoctorId    UNIQUEIDENTIFIER NOT NULL,
        StartTime   DATETIME2(0)     NOT NULL,
        EndTime     DATETIME2(0)     NOT NULL,
        StatusId    UNIQUEIDENTIFIER NOT NULL,
        Notes       NVARCHAR(2000)   NULL,
        IsDeleted   BIT              NOT NULL DEFAULT 0,
        CreatedAt   DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),
        CreatedBy   UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt   DATETIME2(0)     NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_Appointments PRIMARY KEY (Id),
        CONSTRAINT FK_Appointments_Clinics     FOREIGN KEY (ClinicId)  REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_Appointments_Patients    FOREIGN KEY (PatientId) REFERENCES dbo.Patients(Id),
        CONSTRAINT FK_Appointments_Doctors     FOREIGN KEY (DoctorId)  REFERENCES dbo.Doctors(Id),
        CONSTRAINT FK_Appointments_Statuses    FOREIGN KEY (StatusId)  REFERENCES dbo.AppointmentStatuses(Id)
    );

    CREATE NONCLUSTERED INDEX IX_Appointments_ClinicId_StartTime
        ON dbo.Appointments (ClinicId, StartTime DESC) INCLUDE (PatientId, DoctorId, StatusId, IsDeleted);

    CREATE NONCLUSTERED INDEX IX_Appointments_DoctorId_StartTime
        ON dbo.Appointments (DoctorId, StartTime) INCLUDE (ClinicId, PatientId, StatusId, IsDeleted);

    CREATE NONCLUSTERED INDEX IX_Appointments_PatientId
        ON dbo.Appointments (PatientId) INCLUDE (ClinicId, DoctorId, StartTime, StatusId, IsDeleted);

    PRINT 'Tabel Appointments creat.';
END
ELSE
    PRINT 'Tabel Appointments există deja — ignorat.';
GO
