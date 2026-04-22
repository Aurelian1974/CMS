using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ICD10.DTOs;

namespace ValyanClinic.Application.Features.ICD10.Queries.GetICD10Favorites;

public sealed class GetICD10FavoritesQueryHandler(IICD10Repository repository)
    : IRequestHandler<GetICD10FavoritesQuery, Result<IEnumerable<ICD10SearchResultDto>>>
{
    public async Task<Result<IEnumerable<ICD10SearchResultDto>>> Handle(
        GetICD10FavoritesQuery request, CancellationToken cancellationToken)
    {
        var favorites = await repository.GetFavoritesAsync(
            request.UserId, cancellationToken);

        return Result<IEnumerable<ICD10SearchResultDto>>.Success(favorites);
    }
}
