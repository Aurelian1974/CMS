-- ============================================================================
-- Appointments Module — DDL + Seed + Stored Procedures
-- Baza de date: ValyanClinic  |  Server: .\ERP
-- ============================================================================

SET NOCOUNT ON;
GO

-- ════════════════════════════════════════════════════════════════════════════
-- 1. TABELE
-- ════════════════════════════════════════════════════════════════════════════

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
END;
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

    -- Indecși performanță
    CREATE NONCLUSTERED INDEX IX_Appointments_ClinicId_StartTime
        ON dbo.Appointments (ClinicId, StartTime DESC) INCLUDE (PatientId, DoctorId, StatusId, IsDeleted);

    CREATE NONCLUSTERED INDEX IX_Appointments_DoctorId_StartTime
        ON dbo.Appointments (DoctorId, StartTime) INCLUDE (ClinicId, PatientId, StatusId, IsDeleted);

    CREATE NONCLUSTERED INDEX IX_Appointments_PatientId
        ON dbo.Appointments (PatientId) INCLUDE (ClinicId, DoctorId, StartTime, StatusId, IsDeleted);
END;
GO


-- ════════════════════════════════════════════════════════════════════════════
-- 2. STORED PROCEDURES
-- ════════════════════════════════════════════════════════════════════════════

-- ── Appointment_GetPaged ─────────────────────────────────────────────────
-- 3 result sets: items paginate, totalCount, statistici
CREATE OR ALTER PROCEDURE dbo.Appointment_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200) = NULL,
    @DoctorId   UNIQUEIDENTIFIER = NULL,
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @DateFrom   DATETIME2(0) = NULL,
    @DateTo     DATETIME2(0) = NULL,
    @Page       INT = 1,
    @PageSize   INT = 20,
    @SortBy     NVARCHAR(50) = 'StartTime',
    @SortDir    NVARCHAR(4) = 'desc'
AS
BEGIN
    SET NOCOUNT ON;

    -- CTE de bază cu filtrare
    ;WITH FilteredAppointments AS (
        SELECT
            a.Id, a.ClinicId, a.PatientId, a.DoctorId,
            a.StartTime, a.EndTime, a.StatusId, a.Notes,
            a.IsDeleted, a.CreatedAt, a.CreatedBy,
            -- Joins
            CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
            p.PhoneNumber AS PatientPhone,
            CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
            sp.Name AS SpecialtyName,
            s.Name AS StatusName,
            s.Code AS StatusCode,
            CONCAT(cu.LastName, ' ', cu.FirstName) AS CreatedByName
        FROM dbo.Appointments a
        INNER JOIN dbo.Patients p  ON p.Id = a.PatientId
        INNER JOIN dbo.Doctors d   ON d.Id = a.DoctorId
        LEFT  JOIN dbo.Specialties sp ON sp.Id = d.SpecialtyId
        INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
        LEFT  JOIN dbo.Users cu ON cu.Id = a.CreatedBy
        WHERE a.ClinicId = @ClinicId
          AND a.IsDeleted = 0
          AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
          AND (@StatusId IS NULL OR a.StatusId = @StatusId)
          AND (@DateFrom IS NULL OR a.StartTime >= @DateFrom)
          AND (@DateTo   IS NULL OR a.StartTime < DATEADD(DAY, 1, @DateTo))
          AND (@Search IS NULL OR @Search = ''
               OR CONCAT(p.LastName, ' ', p.FirstName) LIKE '%' + @Search + '%'
               OR CONCAT(d.LastName, ' ', d.FirstName) LIKE '%' + @Search + '%'
               OR a.Notes LIKE '%' + @Search + '%')
    )

    -- Result set 1: pagină curentă
    SELECT Id, ClinicId, PatientId, DoctorId, StartTime, EndTime, StatusId, Notes,
           IsDeleted, CreatedAt, CreatedBy, PatientName, PatientPhone, DoctorName,
           SpecialtyName, StatusName, StatusCode, CreatedByName
    FROM FilteredAppointments
    ORDER BY
        CASE WHEN @SortDir = 'asc' THEN
            CASE @SortBy
                WHEN 'PatientName' THEN PatientName
                WHEN 'DoctorName'  THEN DoctorName
                WHEN 'StatusName'  THEN StatusName
                WHEN 'StartTime'   THEN CONVERT(NVARCHAR(30), StartTime, 126)
                WHEN 'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                ELSE CONVERT(NVARCHAR(30), StartTime, 126)
            END
        END ASC,
        CASE WHEN @SortDir = 'desc' THEN
            CASE @SortBy
                WHEN 'PatientName' THEN PatientName
                WHEN 'DoctorName'  THEN DoctorName
                WHEN 'StatusName'  THEN StatusName
                WHEN 'StartTime'   THEN CONVERT(NVARCHAR(30), StartTime, 126)
                WHEN 'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                ELSE CONVERT(NVARCHAR(30), StartTime, 126)
            END
        END DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count (pentru paginare)
    SELECT COUNT(*)
    FROM dbo.Appointments a
    WHERE a.ClinicId = @ClinicId
      AND a.IsDeleted = 0
      AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
      AND (@StatusId IS NULL OR a.StatusId = @StatusId)
      AND (@DateFrom IS NULL OR a.StartTime >= @DateFrom)
      AND (@DateTo   IS NULL OR a.StartTime < DATEADD(DAY, 1, @DateTo))
      AND (@Search IS NULL OR @Search = ''
           OR EXISTS (SELECT 1 FROM dbo.Patients p WHERE p.Id = a.PatientId AND CONCAT(p.LastName, ' ', p.FirstName) LIKE '%' + @Search + '%')
           OR EXISTS (SELECT 1 FROM dbo.Doctors d WHERE d.Id = a.DoctorId AND CONCAT(d.LastName, ' ', d.FirstName) LIKE '%' + @Search + '%')
           OR a.Notes LIKE '%' + @Search + '%');

    -- Result set 3: statistici globale clinică (neafectate de filtre)
    SELECT
        COUNT(*) AS TotalAppointments,
        SUM(CASE WHEN s.Code = 'PROGRAMAT'  THEN 1 ELSE 0 END) AS ScheduledCount,
        SUM(CASE WHEN s.Code = 'CONFIRMAT'  THEN 1 ELSE 0 END) AS ConfirmedCount,
        SUM(CASE WHEN s.Code = 'FINALIZAT'  THEN 1 ELSE 0 END) AS CompletedCount,
        SUM(CASE WHEN s.Code = 'ANULAT'     THEN 1 ELSE 0 END) AS CancelledCount
    FROM dbo.Appointments a
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId = @ClinicId AND a.IsDeleted = 0;
END;
GO


-- ── Appointment_GetById ──────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.Appointment_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.Id, a.ClinicId, a.PatientId,
        CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
        p.PhoneNumber AS PatientPhone,
        p.Cnp AS PatientCnp,
        p.Email AS PatientEmail,
        a.DoctorId,
        CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
        sp.Name AS SpecialtyName,
        d.MedicalCode AS DoctorMedicalCode,
        a.StartTime, a.EndTime,
        a.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        a.Notes, a.IsDeleted, a.CreatedAt,
        CONCAT(cu.LastName, ' ', cu.FirstName) AS CreatedByName,
        a.UpdatedAt, a.UpdatedBy,
        CONCAT(uu.LastName, ' ', uu.FirstName) AS UpdatedByName
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = a.DoctorId
    LEFT  JOIN dbo.Specialties sp ON sp.Id = d.SpecialtyId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    LEFT  JOIN dbo.Users cu ON cu.Id = a.CreatedBy
    LEFT  JOIN dbo.Users uu ON uu.Id = a.UpdatedBy
    WHERE a.Id = @Id AND a.ClinicId = @ClinicId AND a.IsDeleted = 0;
END;
GO


-- ── Appointment_GetByDoctor (scheduler) ──────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.Appointment_GetByDoctor
    @ClinicId  UNIQUEIDENTIFIER,
    @DateFrom  DATETIME2(0),
    @DateTo    DATETIME2(0),
    @DoctorId  UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.Id, a.PatientId,
        CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
        a.DoctorId,
        CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
        a.StartTime, a.EndTime,
        a.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        a.Notes
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId = @ClinicId
      AND a.IsDeleted = 0
      AND a.StartTime >= @DateFrom
      AND a.StartTime < DATEADD(DAY, 1, @DateTo)
      AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
    ORDER BY a.StartTime;
END;
GO


-- ── Appointment_Create ───────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.Appointment_Create
    @ClinicId   UNIQUEIDENTIFIER,
    @PatientId  UNIQUEIDENTIFIER,
    @DoctorId   UNIQUEIDENTIFIER,
    @StartTime  DATETIME2(0),
    @EndTime    DATETIME2(0),
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @Notes      NVARCHAR(2000) = NULL,
    @CreatedBy  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Default status: Programat
    IF @StatusId IS NULL
        SET @StatusId = 'A1000000-0000-0000-0000-000000000001';

    -- Verificare conflict orar (același doctor, interval suprapus)
    IF EXISTS (
        SELECT 1 FROM dbo.Appointments
        WHERE ClinicId = @ClinicId
          AND DoctorId = @DoctorId
          AND IsDeleted = 0
          AND StartTime < @EndTime
          AND EndTime > @StartTime
    )
    BEGIN
        ;THROW 50010, N'Există deja o programare în acest interval orar pentru acest doctor.', 1;
    END;

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO dbo.Appointments (Id, ClinicId, PatientId, DoctorId, StartTime, EndTime, StatusId, Notes, CreatedBy)
    VALUES (@NewId, @ClinicId, @PatientId, @DoctorId, @StartTime, @EndTime, @StatusId, @Notes, @CreatedBy);

    SELECT @NewId;
END;
GO


-- ── Appointment_Update ───────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.Appointment_Update
    @Id         UNIQUEIDENTIFIER,
    @ClinicId   UNIQUEIDENTIFIER,
    @PatientId  UNIQUEIDENTIFIER,
    @DoctorId   UNIQUEIDENTIFIER,
    @StartTime  DATETIME2(0),
    @EndTime    DATETIME2(0),
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @Notes      NVARCHAR(2000) = NULL,
    @UpdatedBy  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50011, N'Programarea nu a fost găsită.', 1;
    END;

    -- Verificare conflict orar (exclude programarea curentă)
    IF EXISTS (
        SELECT 1 FROM dbo.Appointments
        WHERE ClinicId = @ClinicId
          AND DoctorId = @DoctorId
          AND Id <> @Id
          AND IsDeleted = 0
          AND StartTime < @EndTime
          AND EndTime > @StartTime
    )
    BEGIN
        ;THROW 50010, N'Există deja o programare în acest interval orar pentru acest doctor.', 1;
    END;

    UPDATE dbo.Appointments SET
        PatientId = @PatientId,
        DoctorId  = @DoctorId,
        StartTime = @StartTime,
        EndTime   = @EndTime,
        StatusId  = ISNULL(@StatusId, StatusId),
        Notes     = @Notes,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @UpdatedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;
END;
GO


-- ── Appointment_UpdateStatus ─────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.Appointment_UpdateStatus
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @StatusId  UNIQUEIDENTIFIER,
    @UpdatedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50011, N'Programarea nu a fost găsită.', 1;
    END;

    UPDATE dbo.Appointments SET
        StatusId  = @StatusId,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @UpdatedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;
END;
GO


-- ── Appointment_Delete (soft delete) ─────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.Appointment_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50011, N'Programarea nu a fost găsită.', 1;
    END;

    UPDATE dbo.Appointments SET
        IsDeleted = 1,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @DeletedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;
END;
GO


-- ── Appointment_CheckConflict ────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.Appointment_CheckConflict
    @ClinicId    UNIQUEIDENTIFIER,
    @DoctorId    UNIQUEIDENTIFIER,
    @StartTime   DATETIME2(0),
    @EndTime     DATETIME2(0),
    @ExcludeId   UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*)
    FROM dbo.Appointments
    WHERE ClinicId = @ClinicId
      AND DoctorId = @DoctorId
      AND IsDeleted = 0
      AND (@ExcludeId IS NULL OR Id <> @ExcludeId)
      AND StartTime < @EndTime
      AND EndTime > @StartTime;
END;
GO

-- ── Appointment_GetByPatient ─────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.Appointment_GetByPatient
    @ClinicId   UNIQUEIDENTIFIER,
    @PatientId  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.Id, a.PatientId,
        CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
        a.DoctorId,
        CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
        a.StartTime, a.EndTime,
        a.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        a.Notes
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId = @ClinicId
      AND a.PatientId = @PatientId
      AND a.IsDeleted = 0
    ORDER BY a.StartTime DESC;
END;
GO

PRINT '✅ Appointments module — tabele + proceduri create cu succes.';
GO
