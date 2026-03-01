using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetLocalities;

/// <summary>Handler pentru localitățile unui județ.</summary>
public sealed class GetLocalitiesQueryHandler(IGeographyRepository repository)
    : IRequestHandler<GetLocalitiesQuery, Result<IEnumerable<LocalityDto>>>
{
    public async Task<Result<IEnumerable<LocalityDto>>> Handle(
        GetLocalitiesQuery request, CancellationToken cancellationToken)
    {
        var localities = await repository.GetLocalitiesByCountyAsync(request.CountyId, cancellationToken);
        return Result<IEnumerable<LocalityDto>>.Success(localities);
    }
}
