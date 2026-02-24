namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialties;

/// <summary>DTO flat pentru o specializare — include ParentName pentru afișare.</summary>
public sealed record SpecialtyDto(
    Guid Id,
    Guid? ParentId,
    string Name,
    string Code,
    string? Description,
    int DisplayOrder,
    byte Level,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string? ParentName);
