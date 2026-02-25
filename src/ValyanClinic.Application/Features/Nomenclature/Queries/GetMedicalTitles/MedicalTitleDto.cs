namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetMedicalTitles;

/// <summary>DTO flat pentru o titulatură medicală.</summary>
public sealed record MedicalTitleDto(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    int DisplayOrder,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
