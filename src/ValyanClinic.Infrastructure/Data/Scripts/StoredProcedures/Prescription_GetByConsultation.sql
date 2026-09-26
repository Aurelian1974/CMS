SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_GetByConsultation
-- Rețetele generate dintr-o consultație (inclusiv anulate), pentru panoul
-- de tratament din consultație.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_GetByConsultation
    @ConsultationId UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    SELECT
        p.Id,
        p.Series,
        p.Number,
        p.IssueDate,
        p.CreatedAt,
        p.PrescriptionTypeId,
        t.Code                                  AS TypeCode,
        t.Name                                  AS TypeName,
        t.IsCnas,
        p.StatusId,
        s.Code                                  AS StatusCode,
        s.Name                                  AS StatusName,
        p.PatientId,
        CONCAT(pa.LastName, N' ', pa.FirstName) AS PatientName,
        pa.Cnp                                  AS PatientCnp,
        p.DoctorId,
        CONCAT(d.LastName, N' ', d.FirstName)   AS DoctorName,
        p.ConsultationId,
        ct.Name                                 AS CareTypeName,
        p.TreatmentDays,
        p.Diagnostic,
        p.DiagnosticCodes,
        p.NhpCode,
        p.ValidUntil,
        CAST(IIF(p.ValidUntil < @Today AND s.Code IN (N'EMISA', N'TRANSMISA'), 1, 0) AS BIT) AS IsExpired,
        p.ElectronicId,
        (SELECT COUNT(*) FROM dbo.PrescriptionItems pi
         WHERE pi.PrescriptionId = p.Id AND pi.IsDeleted = 0) AS ItemCount
    FROM dbo.Prescriptions p
    INNER JOIN dbo.PrescriptionTypes t      ON t.Id = p.PrescriptionTypeId
    INNER JOIN dbo.PrescriptionStatuses s   ON s.Id = p.StatusId
    INNER JOIN dbo.Patients pa              ON pa.Id = p.PatientId
    INNER JOIN dbo.Doctors d                ON d.Id = p.DoctorId
    LEFT  JOIN dbo.PrescriptionCareTypes ct ON ct.Id = p.CareTypeId
    WHERE p.ConsultationId = @ConsultationId
      AND p.ClinicId = @ClinicId
      AND p.IsDeleted = 0
    ORDER BY t.IsCnas DESC, p.CreatedAt;
END;
GO
