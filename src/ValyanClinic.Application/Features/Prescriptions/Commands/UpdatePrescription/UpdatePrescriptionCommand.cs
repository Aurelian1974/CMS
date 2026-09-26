using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.UpdatePrescription;

/// <summary>Actualizează o rețetă în ciornă (antet + lista completă de medicamente).</summary>
public sealed record UpdatePrescriptionCommand(
    Guid Id,
    Guid? CareTypeId,
    Guid? InsuredCategoryId,
    int? TreatmentDays,
    string? Diagnostic,
    string? DiagnosticCodes,
    string? RegistryNumber,
    bool IsContinuation,
    string? ReferralLetterNumber,
    string? Notes,
    IReadOnlyList<PrescriptionItemData> Items)
    : IRequest<Result<bool>>;
