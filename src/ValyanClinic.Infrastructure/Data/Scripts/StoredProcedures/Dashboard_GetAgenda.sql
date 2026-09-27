SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetAgenda — listele zilei
-- @IncludeClinical = 0 întoarce NULL în locul câmpurilor clinice și liste goale
-- pentru 2) și 3): ce nu iese din SQL nu poate fi citit din răspunsul HTTP.
-- Numărul de result sets e fix, indiferent de parametri (citire pozițională în Dapper).
-- Result sets: 1) agenda zilei  2) consultații în lucru  3) buletine de analize noi
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetAgenda
    @ClinicId        UNIQUEIDENTIFIER,
    @UserId          UNIQUEIDENTIFIER,
    @Today           DATE,
    @OnlyMine        BIT = 0,
    @IncludeClinical BIT = 0,
    @Top             INT = 20,
    @LabDays         INT = 7
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Tomorrow DATE = DATEADD(DAY, 1, @Today);
    DECLARE @LabSince DATE = DATEADD(DAY, -@LabDays, @Today);

    DECLARE @DoctorId UNIQUEIDENTIFIER = NULL;
    IF @OnlyMine = 1
        SELECT @DoctorId = u.DoctorId
        FROM dbo.Users u
        WHERE u.Id = @UserId AND u.ClinicId = @ClinicId AND u.IsDeleted = 0;

    -- ── 1. Agenda zilei ─────────────────────────────────────────────────────
    SELECT TOP (@Top)
        a.Id,
        a.StartTime,
        a.EndTime,
        a.PatientId,
        PatientName  = CONCAT(p.LastName, N' ', p.FirstName),
        PatientPhone = p.PhoneNumber,
        a.DoctorId,
        DoctorName   = CONCAT(d.LastName, N' ', d.FirstName),
        StatusCode   = s.Code,
        StatusName   = s.Name,
        -- Text liber de la programare: poate conține orice, deci aceeași gardă
        Notes        = CASE WHEN @IncludeClinical = 1 THEN a.Notes ELSE NULL END,
        ConsultationId         = cons.Id,
        ConsultationStatusCode = cons.StatusCode
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p            ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d             ON d.Id = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    OUTER APPLY (
        SELECT TOP (1) c.Id, cs.Code AS StatusCode
        FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses cs ON cs.Id = c.StatusId
        WHERE c.AppointmentId = a.Id AND c.IsDeleted = 0
        ORDER BY c.Date DESC
    ) cons
    WHERE a.ClinicId = @ClinicId
      AND a.IsDeleted = 0
      AND a.StartTime >= @Today AND a.StartTime < @Tomorrow
      AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
    ORDER BY a.StartTime;

    -- ── 2. Consultații în lucru (cele mai vechi primele) ────────────────────
    SELECT TOP (@Top)
        c.Id,
        c.Date,
        c.PatientId,
        PatientName = CONCAT(p.LastName, N' ', p.FirstName),
        c.DoctorId,
        DoctorName  = CONCAT(d.LastName, N' ', d.FirstName),
        -- Diagnostic e JSON (cod ICD-10 principal + detalii) sau text vechi: se trimite doar rezumatul
        Diagnostic  = CASE WHEN ISJSON(c.Diagnostic) = 1 AND JSON_VALUE(c.Diagnostic, '$.primaryCode.code') IS NOT NULL
                           THEN CONCAT(JSON_VALUE(c.Diagnostic, '$.primaryCode.code'), N' — ',
                                       JSON_VALUE(c.Diagnostic, '$.primaryCode.shortDescriptionRo'))
                           WHEN ISJSON(c.Diagnostic) = 1 THEN NULL
                           ELSE LEFT(c.Diagnostic, 300) END,
        Motiv       = LEFT(an.Motiv, 500),
        DaysOpen    = DATEDIFF(DAY, CAST(c.Date AS DATE), @Today)
    FROM dbo.Consultations c
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    INNER JOIN dbo.Patients p             ON p.Id = c.PatientId
    INNER JOIN dbo.Doctors d              ON d.Id = c.DoctorId
    LEFT  JOIN dbo.ConsultationAnamnesis an ON an.ConsultationId = c.Id
    WHERE @IncludeClinical = 1
      AND c.ClinicId = @ClinicId
      AND c.IsDeleted = 0
      AND s.Code = N'INLUCRU'
      AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
    ORDER BY c.Date;

    -- ── 3. Buletine de analize recente (cele cu valori anormale primele) ────
    SELECT TOP (@Top)
        r.Id,
        r.ResultDate,
        r.CollectionDate,
        r.PatientId,
        PatientName   = CONCAT(p.LastName, N' ', p.FirstName),
        r.Laboratory,
        r.BulletinNumber,
        r.ConsultationId,
        AbnormalCount = ISNULL(fl.Cnt, 0)
    FROM dbo.AnalysesResults r
    INNER JOIN dbo.Patients p ON p.Id = r.PatientId
    OUTER APPLY (
        SELECT COUNT(*) AS Cnt
        FROM dbo.AnalysesResultDetails ard
        WHERE ard.ResultId = r.Id
          AND ard.IsDeleted = 0
          AND ard.Flag IN (N'HIGH', N'LOW', N'CHECK')
    ) fl
    WHERE @IncludeClinical = 1
      AND r.ClinicId = @ClinicId
      AND r.IsDeleted = 0
      AND r.ResultDate >= @LabSince
      AND r.ResultDate <  @Tomorrow
      -- Medicul vede buletinele pacienților pe care i-a consultat
      AND (@DoctorId IS NULL OR EXISTS (
            SELECT 1 FROM dbo.Consultations c
            WHERE c.PatientId = r.PatientId
              AND c.ClinicId  = @ClinicId
              AND c.DoctorId  = @DoctorId
              AND c.IsDeleted = 0))
    ORDER BY ISNULL(fl.Cnt, 0) DESC, r.ResultDate DESC;
END;
GO
