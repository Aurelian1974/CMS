using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.RecommendedAnalyses.DTOs;

namespace ValyanClinic.Application.Features.RecommendedAnalyses.Queries.GetAllAnalyses;

public sealed record GetAllAnalysesQuery : IRequest<Result<IReadOnlyList<AnalysisDictionaryDto>>>;

public sealed class GetAllAnalysesQueryHandler(IAnalysisDictionaryRepository repository)
    : IRequestHandler<GetAllAnalysesQuery, Result<IReadOnlyList<AnalysisDictionaryDto>>>
{
    public async Task<Result<IReadOnlyList<AnalysisDictionaryDto>>> Handle(
        GetAllAnalysesQuery request, CancellationToken ct)
    {
        var rows = await repository.GetAllAsync(ct);
        return Result<IReadOnlyList<AnalysisDictionaryDto>>.Success(rows);
    }
}
