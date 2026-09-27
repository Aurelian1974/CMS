SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetTrends — serii pentru graficele de management
-- Seriile includ zilele fără activitate (calendar generat): un grafic care sare
-- peste zilele de zero minte despre formă. @Days e plafonat și aici, nu doar în
-- validator, ca să protejeze baza de orice apelant.
-- Result sets: 1) încasări/zi  2) programări/zi  3) rată neprezentare  4) încărcare medici
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetTrends
    @ClinicId UNIQUEIDENTIFIER,
    @Today    DATE,
    @Days     INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Days IS NULL OR @Days < 1 SET @Days = 1;
    IF @Days > 180 SET @Days = 180;

    DECLARE @From DATE = DATEADD(DAY, -(@Days - 1), @Today);
    DECLARE @To   DATE = DATEADD(DAY, 1, @Today);

    CREATE TABLE #Days (D DATE NOT NULL PRIMARY KEY);
    INSERT INTO #Days (D)
    SELECT TOP (@Days) DATEADD(DAY, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1, @From)
    FROM sys.all_objects;

    -- ── 1. Încasări / zi ────────────────────────────────────────────────────
    SELECT
        [Date]       = d.D,
        Amount       = ISNULL(pay.Amount, 0),
        PaymentCount = ISNULL(pay.Cnt, 0)
    FROM #Days d
    LEFT JOIN (
        SELECT CAST(p.PaidAt AS DATE) AS D, SUM(p.Amount) AS Amount, COUNT(*) AS Cnt
        FROM dbo.Payments p
        WHERE p.ClinicId = @ClinicId
          AND p.IsCancelled = 0
          AND p.PaidAt >= @From AND p.PaidAt < @To
        GROUP BY CAST(p.PaidAt AS DATE)
    ) pay ON pay.D = d.D
    ORDER BY d.D;

    -- ── 2. Programări / zi ──────────────────────────────────────────────────
    SELECT
        [Date]         = d.D,
        TotalCount     = ISNULL(ap.Total, 0),
        CompletedCount = ISNULL(ap.Completed, 0),
        CancelledCount = ISNULL(ap.Cancelled, 0),
        NoShowCount    = ISNULL(ap.NoShow, 0)
    FROM #Days d
    LEFT JOIN (
        SELECT
            CAST(a.StartTime AS DATE) AS D,
            COUNT(*) AS Total,
            SUM(CASE WHEN s.Code = N'FINALIZAT'    THEN 1 ELSE 0 END) AS Completed,
            SUM(CASE WHEN s.Code = N'ANULAT'       THEN 1 ELSE 0 END) AS Cancelled,
            SUM(CASE WHEN s.Code = N'NEPREZENTARE' THEN 1 ELSE 0 END) AS NoShow
        FROM dbo.Appointments a
        INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
        WHERE a.ClinicId = @ClinicId
          AND a.IsDeleted = 0
          AND a.StartTime >= @From AND a.StartTime < @To
        GROUP BY CAST(a.StartTime AS DATE)
    ) ap ON ap.D = d.D
    ORDER BY d.D;

    -- ── 3. Rată neprezentare — numitorul exclude anulările ──────────────────
    SELECT
        TotalScheduled = COUNT(*),
        NoShowCount    = ISNULL(SUM(CASE WHEN s.Code = N'NEPREZENTARE' THEN 1 ELSE 0 END), 0),
        NoShowRate     = CAST(CASE WHEN COUNT(*) = 0 THEN 0
                                   ELSE CAST(SUM(CASE WHEN s.Code = N'NEPREZENTARE' THEN 1 ELSE 0 END) AS DECIMAL(9,4))
                                        / COUNT(*) END AS DECIMAL(9,4))
    FROM dbo.Appointments a
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId = @ClinicId
      AND a.IsDeleted = 0
      AND a.StartTime >= @From AND a.StartTime < @To
      AND s.Code <> N'ANULAT';

    -- ── 4. Încărcare pe medic ───────────────────────────────────────────────
    SELECT
        DoctorId         = d.Id,
        DoctorName       = CONCAT(d.LastName, N' ', d.FirstName),
        SpecialtyName    = sp.Name,
        AppointmentCount = COUNT(a.Id),
        CompletedCount   = ISNULL(SUM(CASE WHEN ast.Code = N'FINALIZAT'    THEN 1 ELSE 0 END), 0),
        NoShowCount      = ISNULL(SUM(CASE WHEN ast.Code = N'NEPREZENTARE' THEN 1 ELSE 0 END), 0),
        -- Minutele programate spun mai mult decât numărul de programări
        ScheduledMinutes = ISNULL(SUM(DATEDIFF(MINUTE, a.StartTime, a.EndTime)), 0)
    FROM dbo.Doctors d
    LEFT JOIN dbo.Appointments a ON a.DoctorId = d.Id
                                AND a.ClinicId = @ClinicId
                                AND a.IsDeleted = 0
                                AND a.StartTime >= @From AND a.StartTime < @To
    LEFT JOIN dbo.AppointmentStatuses ast ON ast.Id = a.StatusId
    LEFT JOIN dbo.Specialties sp          ON sp.Id = d.SpecialtyId
    WHERE d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
      AND d.IsActive = 1
    GROUP BY d.Id, d.LastName, d.FirstName, sp.Name
    ORDER BY ScheduledMinutes DESC, DoctorName;

    DROP TABLE #Days;
END;
GO
