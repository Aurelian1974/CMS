using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultsByConsultation;

public sealed record GetAnalysesResultsByConsultationQuery(Guid ConsultationId)
    : IRequest<Result<IReadOnlyList<AnalysesResultListDto>>>;
