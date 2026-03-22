-- =============================================================================
-- Migrare 0025: Program clinică și program medici
-- =============================================================================

-- ── ClinicSchedule ────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ClinicSchedule')
BEGIN
    CREATE TABLE dbo.ClinicSchedule (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId    UNIQUEIDENTIFIER NOT NULL,
        DayOfWeek   TINYINT          NOT NULL,  -- 1=Luni...7=Duminică
        IsOpen      BIT              NOT NULL DEFAULT 1,
        OpenTime    TIME(0)          NULL,
        CloseTime   TIME(0)          NULL,
        CreatedAt   DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy   UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt   DATETIME2        NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_ClinicSchedule_Clinics FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id),
        CONSTRAINT UQ_ClinicSchedule_Day     UNIQUE (ClinicId, DayOfWeek),
        CONSTRAINT CK_ClinicSchedule_Day     CHECK (DayOfWeek BETWEEN 1 AND 7)
    );

    PRINT 'Tabel ClinicSchedule creat.';
END;
GO

-- ── DoctorSchedule ────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DoctorSchedule')
BEGIN
    CREATE TABLE dbo.DoctorSchedule (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId    UNIQUEIDENTIFIER NOT NULL,
        DoctorId    UNIQUEIDENTIFIER NOT NULL,
        DayOfWeek   TINYINT          NOT NULL,  -- 1=Luni...7=Duminică
        StartTime   TIME(0)          NOT NULL,
        EndTime     TIME(0)          NOT NULL,
        CreatedAt   DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy   UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt   DATETIME2        NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_DoctorSchedule_Clinics  FOREIGN KEY (ClinicId)  REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_DoctorSchedule_Doctors  FOREIGN KEY (DoctorId)  REFERENCES dbo.Doctors(Id),
        CONSTRAINT UQ_DoctorSchedule_Day      UNIQUE (DoctorId, DayOfWeek),
        CONSTRAINT CK_DoctorSchedule_Day      CHECK (DayOfWeek BETWEEN 1 AND 7),
        CONSTRAINT CK_DoctorSchedule_Times    CHECK (EndTime > StartTime)
    );

    PRINT 'Tabel DoctorSchedule creat.';
END;
GO

PRINT 'Migrarea 0025_CreateSchedules finalizata cu succes.';
GO
