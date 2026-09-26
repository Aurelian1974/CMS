using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationMedications.Commands.UpdateConsultationMedication;

public sealed record UpdateConsultationMedicationCommand(
    Guid Id,
    string? CopaymentListType,
    decimal? DoseMorning,
    decimal? DoseAfternoon,
    decimal? DoseEvening,
    int? DurationDays,
    string? Notes) : IRequest<Result<bool>>;
