using ValyanClinic.Application.Features.Nomenclature.Queries.GetCounties;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetLocalities;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Repository pentru date geografice: județe și localități.</summary>
public interface IGeographyRepository
{
    Task<IEnumerable<CountyDto>> GetCountiesAsync(CancellationToken ct);
    Task<IEnumerable<LocalityDto>> GetLocalitiesByCountyAsync(Guid countyId, CancellationToken ct);
}
