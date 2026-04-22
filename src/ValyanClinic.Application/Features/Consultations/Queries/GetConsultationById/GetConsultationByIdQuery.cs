using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;

namespace ValyanClinic.Application.Features.Consultations.Queries.GetConsultationById;

/// <summary>Obținere detalii complete consultație după Id.</summary>
public sealed record GetConsultationByIdQuery(Guid Id) : IRequest<Result<ConsultationDetailDto>>;
