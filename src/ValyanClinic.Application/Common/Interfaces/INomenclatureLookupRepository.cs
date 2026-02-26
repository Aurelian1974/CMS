using ValyanClinic.Application.Features.Nomenclature.Queries.GetNomenclatureLookup;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Repository pentru nomenclatoare simple (lookup tables cu structură identică: Id, Name, Code, IsActive).</summary>
public interface INomenclatureLookupRepository
{
    Task<IEnumerable<NomenclatureLookupDto>> GetGendersAsync(bool? isActive, CancellationToken ct);
    Task<IEnumerable<NomenclatureLookupDto>> GetBloodTypesAsync(bool? isActive, CancellationToken ct);
    Task<IEnumerable<NomenclatureLookupDto>> GetAllergyTypesAsync(bool? isActive, CancellationToken ct);
    Task<IEnumerable<NomenclatureLookupDto>> GetAllergySeveritiesAsync(bool? isActive, CancellationToken ct);
}
