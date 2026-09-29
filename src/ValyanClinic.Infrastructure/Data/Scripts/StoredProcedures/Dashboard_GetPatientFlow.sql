SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetPatientFlow — unde se află fiecare pacient al zilei și ce a rămas
-- nerezolvat. Fără coloane clinice (acces pe modulul appointments).
-- Stadiile/tipurile sunt oglindite în DashboardFlowStages / DashboardAttentionTypes.
-- Result sets: 1) fluxul zilei (programări + consultații fără programare)  2) necesită atenție
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetPatientFlow
    @ClinicId         UNIQUEIDENTIFIER,
    @UserId           UNIQUEIDENTIFIER,
    @Today            DATE,
    -- Ora curentă în fusul clinicii; NULL = fără programări „întârziate”
    @Now              DATETIME2(0) = NULL,
    @OnlyMine         BIT = 0,
    -- 0 = stadiul „de încasat” se contopește în „încheiat” și suma nu se întoarce
    @IncludeFinancial BIT = 0,
    @LateMinutes      INT = 15,
    @UnresolvedDays   INT = 7,
    @Top              INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Tomorrow        DATE = DATEADD(DAY, 1, @Today);
    DECLARE @UnresolvedSince DATE = DATEADD(DAY, -@UnresolvedDays, @Today);
    DECLARE @LateBefore      DATETIME2(0) = DATEADD(MINUTE, -@LateMinutes, @Now);

    DECLARE @DoctorId UNIQUEIDENTIFIER = NULL;
    IF @OnlyMine = 1
        SELECT @DoctorId = u.DoctorId
        FROM dbo.Users u
        WHERE u.Id = @UserId AND u.ClinicId = @ClinicId AND u.IsDeleted = 0;

    -- ── 1. Fluxul zilei ─────────────────────────────────────────────────────
    ;WITH Items AS (
        SELECT
            AppointmentId = a.Id,
            ConsultationId = cons.Id,
            [Time] = a.StartTime,
            a.PatientId,
            a.DoctorId,
            AppointmentStatusCode = s.Code,
            AppointmentStatusName = s.Name,
            ConsultationStatusCode = cons.Code,
            StartedAt = cons.CreatedAt
        FROM dbo.Appointments a
        INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
        OUTER APPLY (
            SELECT TOP (1) c.Id, cs.Code, c.CreatedAt
            FROM dbo.Consultations c
            INNER JOIN dbo.ConsultationStatuses cs ON cs.Id = c.StatusId
            WHERE c.AppointmentId = a.Id AND c.IsDeleted = 0
            ORDER BY c.CreatedAt DESC
        ) cons
        WHERE a.ClinicId = @ClinicId
          AND a.IsDeleted = 0
          AND a.StartTime >= @Today AND a.StartTime < @Tomorrow
          AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)

        UNION ALL

        -- Pacienți fără programare: ora e momentul deschiderii fișei
        SELECT NULL, c.Id, c.CreatedAt, c.PatientId, c.DoctorId, NULL, NULL, cs.Code, c.CreatedAt
        FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses cs ON cs.Id = c.StatusId
        WHERE c.ClinicId = @ClinicId
          AND c.IsDeleted = 0
          AND c.AppointmentId IS NULL
          AND c.Date >= @Today AND c.Date < @Tomorrow
          AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
    )
    SELECT TOP (@Top)
        i.AppointmentId,
        i.ConsultationId,
        i.[Time],
        i.PatientId,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName),
        i.DoctorId,
        DoctorName  = CONCAT(d.LastName, N' ', d.FirstName),
        i.AppointmentStatusCode,
        i.AppointmentStatusName,
        i.ConsultationStatusCode,
        i.StartedAt,
        Stage = CASE
            WHEN i.ConsultationStatusCode = N'INLUCRU' THEN N'IN_CONSULTATION'
            WHEN i.ConsultationStatusCode IS NOT NULL
                THEN CASE WHEN bal.Due > 0 THEN N'TO_PAY' ELSE N'DONE' END
            WHEN i.AppointmentStatusCode IN (N'ANULAT', N'NEPREZENTARE') THEN N'CANCELLED'
            WHEN i.AppointmentStatusCode = N'CONFIRMAT' THEN N'WAITING'
            WHEN i.AppointmentStatusCode = N'FINALIZAT' THEN N'DONE'
            ELSE N'TO_CONFIRM'
        END,
        AmountDue = CASE WHEN bal.Due > 0 THEN bal.Due END
    FROM Items i
    INNER JOIN dbo.Patients p ON p.Id = i.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = i.DoctorId
    -- Același calcul ca Dashboard_GetFinancialKpis: servicii minus plăți necancelate
    OUTER APPLY (
        SELECT Due = ISNULL((SELECT SUM(cs.LineTotal) FROM dbo.ConsultationServices cs
                             WHERE cs.ConsultationId = i.ConsultationId AND cs.IsDeleted = 0), 0)
                   - ISNULL((SELECT SUM(pay.Amount) FROM dbo.Payments pay
                             WHERE pay.ConsultationId = i.ConsultationId AND pay.IsCancelled = 0), 0)
        WHERE @IncludeFinancial = 1
          AND i.ConsultationId IS NOT NULL
          AND i.ConsultationStatusCode <> N'INLUCRU'
    ) bal
    ORDER BY i.[Time];

    -- ── 2. Necesită atenție ─────────────────────────────────────────────────
    SELECT TOP (@Top)
        x.[Type], x.AppointmentId, x.ConsultationId, x.OccurredAt, x.PatientId,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName),
        x.DoctorId,
        DoctorName  = CONCAT(d.LastName, N' ', d.FirstName),
        x.StatusCode, x.StatusName, x.DaysOpen
    FROM (
        -- Consultații începute în zilele anterioare și nefinalizate
        SELECT [Type] = N'STALE_CONSULTATION', c.AppointmentId, ConsultationId = c.Id,
               OccurredAt = c.Date, c.PatientId, c.DoctorId,
               StatusCode = cs.Code, StatusName = cs.Name,
               DaysOpen = DATEDIFF(DAY, CAST(c.Date AS DATE), @Today), SortGroup = 1
        FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses cs ON cs.Id = c.StatusId
        WHERE c.ClinicId = @ClinicId
          AND c.IsDeleted = 0
          AND cs.Code = N'INLUCRU'
          AND c.Date < @Today
          AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)

        UNION ALL

        -- Programări din zilele trecute rămase deschise, fără consultație
        SELECT N'UNRESOLVED_APPOINTMENT', a.Id, NULL, a.StartTime, a.PatientId, a.DoctorId,
               s.Code, s.Name, DATEDIFF(DAY, CAST(a.StartTime AS DATE), @Today), 2
        FROM dbo.Appointments a
        INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
        WHERE a.ClinicId = @ClinicId
          AND a.IsDeleted = 0
          AND s.Code IN (N'PROGRAMAT', N'CONFIRMAT')
          AND a.StartTime >= @UnresolvedSince AND a.StartTime < @Today
          AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
          AND NOT EXISTS (SELECT 1 FROM dbo.Consultations c WHERE c.AppointmentId = a.Id AND c.IsDeleted = 0)

        UNION ALL

        -- Azi: ora a trecut și pacientul tot neconfirmat
        SELECT N'LATE_APPOINTMENT', a.Id, NULL, a.StartTime, a.PatientId, a.DoctorId,
               s.Code, s.Name, 0, 3
        FROM dbo.Appointments a
        INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
        WHERE a.ClinicId = @ClinicId
          AND a.IsDeleted = 0
          AND s.Code = N'PROGRAMAT'
          AND a.StartTime >= @Today AND a.StartTime <= @LateBefore
          AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
          AND NOT EXISTS (SELECT 1 FROM dbo.Consultations c WHERE c.AppointmentId = a.Id AND c.IsDeleted = 0)
    ) x
    INNER JOIN dbo.Patients p ON p.Id = x.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = x.DoctorId
    ORDER BY x.SortGroup, x.OccurredAt;
END;
GO
