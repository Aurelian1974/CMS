using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.CreatePrescriptions;

/// <summary>
/// Creează rețete din lista de medicamente; medicamentele compensate și cele necompensate
/// ajung automat pe rețete separate (compensată / simplă). Returnează Id-urile create.
/// </summary>
public sealed record CreatePrescriptionsCommand(
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
    IReadOnlyList<PrescriptionItemData> Items)
    : IRequest<Result<IReadOnlyList<Guid>>>;
