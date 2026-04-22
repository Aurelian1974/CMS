using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ICD10.DTOs;

namespace ValyanClinic.Application.Features.ICD10.Queries.SearchICD10;

public sealed class SearchICD10QueryHandler(IICD10Repository repository)
    : IRequestHandler<SearchICD10Query, Result<IEnumerable<ICD10SearchResultDto>>>
{
    public async Task<Result<IEnumerable<ICD10SearchResultDto>>> Handle(
        SearchICD10Query request, CancellationToken cancellationToken)
    {
        var results = await repository.SearchAsync(
            request.SearchTerm, request.MaxResults, cancellationToken);

        return Result<IEnumerable<ICD10SearchResultDto>>.Success(results);
    }
}
