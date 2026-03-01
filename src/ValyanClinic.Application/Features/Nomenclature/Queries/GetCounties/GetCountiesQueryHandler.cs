using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetCounties;

/// <summary>Handler pentru lista județelor active.</summary>
public sealed class GetCountiesQueryHandler(IGeographyRepository repository)
    : IRequestHandler<GetCountiesQuery, Result<IEnumerable<CountyDto>>>
{
    public async Task<Result<IEnumerable<CountyDto>>> Handle(
        GetCountiesQuery request, CancellationToken cancellationToken)
    {
        var counties = await repository.GetCountiesAsync(cancellationToken);
        return Result<IEnumerable<CountyDto>>.Success(counties);
    }
}
