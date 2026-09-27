SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Dashboard_GetClinicalKpis — contoarele clinice ale zilei
-- @Today vine de la handler (fusul clinicii), nu din SYSDATETIME(): SP determinist.
-- @OnlyMine = 1 restrânge la medicul legat de @UserId; un cont fără DoctorId
-- vede clinica întreagă. Result set: 1 rând de contoare.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Dashboard_GetClinicalKpis
    @ClinicId      UNIQUEIDENTIFIER,
    @UserId        UNIQUEIDENTIFIER,
    @Today         DATE,
    @OnlyMine      BIT = 0,
    @FollowUpDays  INT = 14
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Tomorrow    DATE = DATEADD(DAY, 1, @Today);
    DECLARE @MonthStart  DATE = DATEFROMPARTS(YEAR(@Today), MONTH(@Today), 1);
    DECLARE @NextMonth   DATE = DATEADD(MONTH, 1, @MonthStart);
    DECLARE @FollowUpEnd DATE = DATEADD(DAY, @FollowUpDays, @Today);

    DECLARE @DoctorId UNIQUEIDENTIFIER = NULL;
    IF @OnlyMine = 1
        SELECT @DoctorId = u.DoctorId
        FROM dbo.Users u
        WHERE u.Id = @UserId AND u.ClinicId = @ClinicId AND u.IsDeleted = 0;

    SELECT
        -- ANULAT / NEPREZENTARE sunt evenimente încheiate, nu lucru al zilei
        AppointmentsToday = (
            SELECT COUNT(*)
            FROM dbo.Appointments a
            INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
            WHERE a.ClinicId = @ClinicId
              AND a.IsDeleted = 0
              AND a.StartTime >= @Today AND a.StartTime < @Tomorrow
              AND s.Code NOT IN (N'ANULAT', N'NEPREZENTARE')
              AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
        ),
        AppointmentsTodayRemaining = (
            SELECT COUNT(*)
            FROM dbo.Appointments a
            INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
            WHERE a.ClinicId = @ClinicId
              AND a.IsDeleted = 0
              AND a.StartTime >= @Today AND a.StartTime < @Tomorrow
              AND s.Code IN (N'PROGRAMAT', N'CONFIRMAT')
              AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
        ),
        ConsultationsToday = (
            SELECT COUNT(*)
            FROM dbo.Consultations c
            WHERE c.ClinicId = @ClinicId
              AND c.IsDeleted = 0
              AND c.Date >= @Today AND c.Date < @Tomorrow
              AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
        ),
        -- Nelimitat la azi: o consultație lăsată deschisă ieri e exact ce trebuie arătat
        ConsultationsOpen = (
            SELECT COUNT(*)
            FROM dbo.Consultations c
            INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
            WHERE c.ClinicId = @ClinicId
              AND c.IsDeleted = 0
              AND s.Code = N'INLUCRU'
              AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
        ),
        -- Reveniri în fereastră pentru care pacientul nu are deja o programare viitoare
        FollowUpsDue = (
            SELECT COUNT(*)
            FROM dbo.Consultations c
            WHERE c.ClinicId = @ClinicId
              AND c.IsDeleted = 0
              AND c.DataUrmatoareiVizite >= @Today
              AND c.DataUrmatoareiVizite <  @FollowUpEnd
              AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
              AND NOT EXISTS (
                    SELECT 1 FROM dbo.Appointments a
                    INNER JOIN dbo.AppointmentStatuses asx ON asx.Id = a.StatusId
                    WHERE a.PatientId = c.PatientId
                      AND a.ClinicId  = @ClinicId
                      AND a.IsDeleted = 0
                      AND a.StartTime >= @Today
                      AND asx.Code IN (N'PROGRAMAT', N'CONFIRMAT'))
        ),
        PatientsNewThisMonth = (
            SELECT COUNT(*)
            FROM dbo.Patients p
            WHERE p.ClinicId = @ClinicId
              AND p.IsDeleted = 0
              AND p.CreatedAt >= @MonthStart AND p.CreatedAt < @NextMonth
        ),
        PrescriptionsDraft = (
            SELECT COUNT(*)
            FROM dbo.Prescriptions pr
            INNER JOIN dbo.PrescriptionStatuses ps ON ps.Id = pr.StatusId
            WHERE pr.ClinicId = @ClinicId
              AND pr.IsDeleted = 0
              AND ps.Code = N'CIORNA'
              AND (@DoctorId IS NULL OR pr.DoctorId = @DoctorId)
        ),
        PrescriptionsWithTransmissionError = (
            SELECT COUNT(*)
            FROM dbo.Prescriptions pr
            WHERE pr.ClinicId = @ClinicId
              AND pr.IsDeleted = 0
              AND pr.TransmissionError IS NOT NULL
              AND (@DoctorId IS NULL OR pr.DoctorId = @DoctorId)
        );
END;
GO
