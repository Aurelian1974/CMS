namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Antetul comun + medicamentele din care se generează una sau mai multe rețete.</summary>
public sealed record PrescriptionCreateData(
    Guid ClinicId,
    Guid PatientId,
    Guid DoctorId,
    Guid? ConsultationId,
    Guid? CareTypeId,
    Guid? InsuredCategoryId,
    int? TreatmentDays,
    string? Diagnostic,
    string? DiagnosticCodes,
    string? RegistryNumber,
    bool IsContinuation,
    string? ReferralLetterNumber,
    string? Notes,
    IReadOnlyList<PrescriptionItemData> Items);
