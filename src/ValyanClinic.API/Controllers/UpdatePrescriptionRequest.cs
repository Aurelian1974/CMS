using ValyanClinic.Application.Common.Interfaces;

namespace ValyanClinic.API.Controllers;

public sealed record UpdatePrescriptionRequest(
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
