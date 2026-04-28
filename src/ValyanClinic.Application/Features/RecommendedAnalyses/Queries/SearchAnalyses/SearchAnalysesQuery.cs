using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.RecommendedAnalyses.DTOs;

namespace ValyanClinic.Application.Features.RecommendedAnalyses.Queries.SearchAnalyses;

public sealed record SearchAnalysesQuery(string Query, int Top = 50)
    : IRequest<Result<IReadOnlyList<AnalysisDictionaryDto>>>;

public sealed class SearchAnalysesQueryHandler(IAnalysisDictionaryRepository repository)
    : IRequestHandler<SearchAnalysesQuery, Result<IReadOnlyList<AnalysisDictionaryDto>>>
{
    public async Task<Result<IReadOnlyList<AnalysisDictionaryDto>>> Handle(
        SearchAnalysesQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return Result<IReadOnlyList<AnalysisDictionaryDto>>.Success(Array.Empty<AnalysisDictionaryDto>());

        var top = request.Top is <= 0 or > 200 ? 50 : request.Top;
        var rows = await repository.SearchAsync(request.Query.Trim(), top, ct);
        return Result<IReadOnlyList<AnalysisDictionaryDto>>.Success(rows);
    }
}
