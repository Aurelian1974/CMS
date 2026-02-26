namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetNomenclatureLookup;

/// <summary>DTO partajat pentru nomenclatoare simple (Genders, BloodTypes, AllergyTypes, AllergySeverities).</summary>
public sealed record NomenclatureLookupDto(
    Guid Id,
    string Name,
    string Code,
    bool IsActive);
