namespace ValyanClinic.Application.Common.Interfaces;

public sealed record PrescriptionUpdateData(
    Guid Id,
    Guid ClinicId,
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
