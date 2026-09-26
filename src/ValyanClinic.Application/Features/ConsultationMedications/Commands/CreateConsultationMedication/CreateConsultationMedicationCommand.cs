using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationMedications.Commands.CreateConsultationMedication;

public sealed record CreateConsultationMedicationCommand(
    Guid ConsultationId,
    string DrugCode,
    string? CopaymentListType,
    decimal? DoseMorning,
    decimal? DoseAfternoon,
    decimal? DoseEvening,
    int? DurationDays,
    string? Notes) : IRequest<Result<Guid>>;
