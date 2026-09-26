using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ConsultationMedications.DTOs;

namespace ValyanClinic.Application.Features.ConsultationMedications.Queries.GetConsultationMedications;

public sealed record GetConsultationMedicationsQuery(Guid ConsultationId)
    : IRequest<Result<IReadOnlyList<ConsultationMedicationDto>>>;
