SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_GetById
-- Result sets: 1) antetul rețetei (pacient, medic, unitate, nomenclatoare)
--              2) medicamentele
-- Returnează și rețetele anulate (pentru vizualizare / tipărire istoric).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    SELECT
        p.Id,
        p.ClinicId,
        cl.Name                                         AS ClinicName,
        cl.FiscalCode                                   AS ClinicFiscalCode,
        cl.ContractCNAS                                 AS ClinicCnasContract,
        CONCAT_WS(N', ', cl.Address, cl.City, cl.County) AS ClinicAddress,
        cl.PhoneNumber                                  AS ClinicPhone,
        p.PatientId,
        CONCAT(pa.LastName, N' ', pa.FirstName)         AS PatientName,
        pa.Cnp                                          AS PatientCnp,
        pa.BirthDate                                    AS PatientBirthDate,
        g.Name                                          AS PatientGender,
        CONCAT_WS(N', ', pa.Address, pa.City, pa.County) AS PatientAddress,
        pa.IsInsured                                    AS PatientIsInsured,
        p.DoctorId,
        CONCAT(d.LastName, N' ', d.FirstName)           AS DoctorName,
        d.MedicalCode                                   AS DoctorMedicalCode,
        sp.Name                                         AS DoctorSpecialty,
        p.ConsultationId,
        c.Date                                          AS ConsultationDate,
        p.PrescriptionTypeId,
        t.Code                                          AS TypeCode,
        t.Name                                          AS TypeName,
        t.IsCnas,
        p.StatusId,
        s.Code                                          AS StatusCode,
        s.Name                                          AS StatusName,
        p.CareTypeId,
        ct.Code                                         AS CareTypeCode,
        ct.Name                                         AS CareTypeName,
        ct.MaxDays                                      AS CareTypeMaxDays,
        p.InsuredCategoryId,
        ic.Name                                         AS InsuredCategoryName,
        p.NhpCode,
        nhp.Description                                 AS NhpName,
        p.Series,
        p.Number,
        p.IssueDate,
        p.ValidUntil,
        CAST(IIF(p.ValidUntil < @Today AND s.Code IN (N'EMISA', N'TRANSMISA'), 1, 0) AS BIT) AS IsExpired,
        p.TreatmentDays,
        p.Diagnostic,
        p.DiagnosticCodes,
        p.RegistryNumber,
        p.IsContinuation,
        p.ReferralLetterNumber,
        p.Notes,
        p.ElectronicId,
        p.IsOffline,
        p.TransmittedAt,
        p.TransmissionError,
        p.CancelReason,
        p.CancelledAt,
        p.IsDeleted,
        p.CreatedAt,
        p.UpdatedAt
    FROM dbo.Prescriptions p
    INNER JOIN dbo.Clinics cl                        ON cl.Id = p.ClinicId
    INNER JOIN dbo.PrescriptionTypes t               ON t.Id = p.PrescriptionTypeId
    INNER JOIN dbo.PrescriptionStatuses s            ON s.Id = p.StatusId
    INNER JOIN dbo.Patients pa                       ON pa.Id = p.PatientId
    INNER JOIN dbo.Doctors d                         ON d.Id = p.DoctorId
    LEFT  JOIN dbo.Specialties sp                    ON sp.Id = d.SpecialtyId
    LEFT  JOIN dbo.Genders g                         ON g.Id = pa.GenderId
    LEFT  JOIN dbo.Consultations c                   ON c.Id = p.ConsultationId AND c.IsDeleted = 0
    LEFT  JOIN dbo.PrescriptionCareTypes ct          ON ct.Id = p.CareTypeId
    LEFT  JOIN dbo.PrescriptionInsuredCategories ic  ON ic.Id = p.InsuredCategoryId
    LEFT  JOIN dbo.Cnas_NHP nhp                      ON nhp.Code = p.NhpCode
    WHERE p.Id = @Id
      AND p.ClinicId = @ClinicId
      AND p.IsDeleted = 0;

    SELECT
        pi.Id,
        pi.PrescriptionId,
        pi.ConsultationMedicationId,
        pi.DrugCode,
        pi.DrugName,
        pi.ActiveSubstance,
        pi.PharmaceuticalForm,
        pi.Concentration,
        pi.PrescriptionMode,
        pi.CopaymentListType,
        pi.CopaymentPercent,
        cl.CopaymentLists AS AvailableCopaymentLists,
        pi.DiagnosisCode,
        pi.DoseMorning,
        pi.DoseAfternoon,
        pi.DoseEvening,
        pi.DurationDays,
        pi.Quantity,
        pi.Instructions,
        pi.SortOrder
    FROM dbo.PrescriptionItems pi
    INNER JOIN dbo.Prescriptions p ON p.Id = pi.PrescriptionId AND p.IsDeleted = 0
    OUTER APPLY (
        SELECT STRING_AGG(x.CopaymentListType, N',') WITHIN GROUP (ORDER BY x.CopaymentListType) AS CopaymentLists
        FROM (
            SELECT DISTINCT cld.CopaymentListType
            FROM dbo.Cnas_CopaymentListDrug cld
            WHERE cld.DrugCode = pi.DrugCode AND cld.IsActive = 1
        ) x
    ) cl
    WHERE pi.PrescriptionId = @Id
      AND pi.ClinicId = @ClinicId
      AND pi.IsDeleted = 0
    ORDER BY pi.SortOrder;
END;
GO
