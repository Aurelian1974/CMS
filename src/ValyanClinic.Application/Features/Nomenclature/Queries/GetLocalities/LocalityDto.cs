namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetLocalities;

/// <summary>DTO pentru o localitate dintr-un județ.</summary>
public sealed record LocalityDto(
    Guid Id,
    string Name,
    string? LocationTypeCode,
    string? LocationTypeName);
