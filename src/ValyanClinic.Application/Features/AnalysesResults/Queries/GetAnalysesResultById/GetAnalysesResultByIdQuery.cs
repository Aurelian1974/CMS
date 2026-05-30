using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultById;

public sealed record GetAnalysesResultByIdQuery(Guid Id)
    : IRequest<Result<AnalysesResultDetailDto>>;
