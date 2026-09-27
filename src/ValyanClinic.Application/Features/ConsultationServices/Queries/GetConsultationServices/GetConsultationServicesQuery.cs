using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ConsultationServices.DTOs;

namespace ValyanClinic.Application.Features.ConsultationServices.Queries.GetConsultationServices;

public sealed record GetConsultationServicesQuery(Guid ConsultationId)
    : IRequest<Result<ConsultationServicesResponse>>;
