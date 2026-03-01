namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetCounties;

/// <summary>DTO pentru un județ din nomenclatorul geografic.</summary>
public sealed record CountyDto(
    Guid Id,
    string Name,
    string Abbreviation,
    int? SortOrder);
