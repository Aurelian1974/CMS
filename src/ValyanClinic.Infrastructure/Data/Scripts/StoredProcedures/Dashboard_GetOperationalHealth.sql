SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetOperationalHealth — sănătatea operațională (admin)
-- @SinceUtc e separat de @Today: SecurityEvents.OccurredAt e în UTC (SYSUTCDATETIME),
-- restul schemei în ora locală.
-- Result sets: 1) evenimente de securitate eșuate  2) conturi blocate
--              3) avize CMR  4) asigurări pacienți  5) prospețime nomenclatoare
--              6) activitate recentă (AuditLogs)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetOperationalHealth
    @ClinicId   UNIQUEIDENTIFIER,
    @Today      DATE,
    @SinceUtc   DATETIME2(0),
    @ExpiryDays INT = 60,
    @Top        INT = 15
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ExpiryLimit  DATE = DATEADD(DAY, @ExpiryDays, @Today);
    DECLARE @ActiveSince  DATE = DATEADD(MONTH, -12, @Today);

    -- ── 1. Securitate ───────────────────────────────────────────────────────
    -- ClinicId NULL = login eșuat cu email necunoscut; exact ce interesează un admin.
    SELECT TOP (@Top)
        se.Id,
        se.EventType,
        se.Succeeded,
        se.OccurredAt,
        se.EmailAttempted,
        se.IpAddress,
        UserFullName = CASE WHEN u.Id IS NULL THEN NULL ELSE CONCAT(u.LastName, N' ', u.FirstName) END
    FROM dbo.SecurityEvents se
    LEFT JOIN dbo.Users u ON u.Id = se.UserId
    WHERE se.OccurredAt >= @SinceUtc
      AND (se.ClinicId = @ClinicId OR se.ClinicId IS NULL)
      AND se.Succeeded = 0
    ORDER BY se.OccurredAt DESC;

    -- ── 2. Conturi blocate (LockoutEnd e scris cu GETDATE()) ────────────────
    SELECT TOP (@Top)
        u.Id,
        FullName = CONCAT(u.LastName, N' ', u.FirstName),
        u.Email,
        u.LockoutEnd,
        u.FailedLoginAttempts,
        u.LastLoginAt
    FROM dbo.Users u
    WHERE u.ClinicId = @ClinicId
      AND u.IsDeleted = 0
      AND u.LockoutEnd IS NOT NULL
      AND u.LockoutEnd > GETDATE()
    ORDER BY u.LockoutEnd DESC;

    -- ── 3. Avize CMR — și cele deja expirate (DaysLeft negativ) ─────────────
    SELECT TOP (@Top)
        DoctorId   = d.Id,
        DoctorName = CONCAT(d.LastName, N' ', d.FirstName),
        d.LicenseNumber,
        d.LicenseExpiresAt,
        DaysLeft   = DATEDIFF(DAY, @Today, d.LicenseExpiresAt)
    FROM dbo.Doctors d
    WHERE d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
      AND d.IsActive = 1
      AND d.LicenseExpiresAt IS NOT NULL
      AND d.LicenseExpiresAt < @ExpiryLimit
    ORDER BY d.LicenseExpiresAt;

    -- ── 4. Asigurări — doar pacienți cu programări în ultimele 12 luni ──────
    SELECT TOP (@Top)
        PatientId   = p.Id,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName),
        p.PhoneNumber,
        p.InsuranceNumber,
        p.InsuranceExpiry,
        DaysLeft    = DATEDIFF(DAY, @Today, p.InsuranceExpiry)
    FROM dbo.Patients p
    WHERE p.ClinicId = @ClinicId
      AND p.IsDeleted = 0
      AND p.InsuranceExpiry IS NOT NULL
      AND p.InsuranceExpiry < @ExpiryLimit
      AND EXISTS (
            SELECT 1 FROM dbo.Appointments a
            WHERE a.PatientId = p.Id
              AND a.ClinicId  = @ClinicId
              AND a.IsDeleted = 0
              AND a.StartTime >= @ActiveSince)
    ORDER BY p.InsuranceExpiry;

    -- ── 5. Prospețime nomenclatoare ─────────────────────────────────────────
    -- Log-urile sunt globale (date de referință naționale) — fără ClinicId.
    SELECT
        Source        = N'ANM',
        LastSuccessAt = (SELECT MAX(l.FinishedAt) FROM dbo.Anm_SyncLog l WHERE l.Status = N'Success'),
        LastStatus    = (SELECT TOP (1) l.Status FROM dbo.Anm_SyncLog l ORDER BY l.StartedAt DESC),
        LastRunAt     = (SELECT MAX(l.StartedAt) FROM dbo.Anm_SyncLog l)
    UNION ALL
    SELECT
        Source        = N'CNAS',
        LastSuccessAt = (SELECT MAX(l.FinishedAt) FROM dbo.NomenclatorSyncLog l WHERE l.Status = N'Success'),
        LastStatus    = (SELECT TOP (1) l.Status FROM dbo.NomenclatorSyncLog l ORDER BY l.StartedAt DESC),
        LastRunAt     = (SELECT MAX(l.StartedAt) FROM dbo.NomenclatorSyncLog l);

    -- ── 6. Activitate recentă — fără OldValues/NewValues (pot conține date clinice) ──
    SELECT TOP (@Top)
        al.Id,
        al.EntityType,
        al.EntityId,
        al.Action,
        al.ChangedAt,
        ChangedByName = CASE WHEN u.Id IS NULL THEN NULL ELSE CONCAT(u.LastName, N' ', u.FirstName) END
    FROM dbo.AuditLogs al
    LEFT JOIN dbo.Users u ON u.Id = al.ChangedBy
    WHERE al.ClinicId = @ClinicId
    ORDER BY al.ChangedAt DESC;
END;
GO
