using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetConsultationPrescriptions;

public sealed record GetConsultationPrescriptionsQuery(Guid ConsultationId)
    : IRequest<Result<IReadOnlyList<PrescriptionListDto>>>;
