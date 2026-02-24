namespace ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialtyTree;

/// <summary>DTO nod în arborele de specializări — include lista copiilor.</summary>
public sealed class SpecialtyTreeNodeDto
{
    public Guid Id { get; init; }
    public Guid? ParentId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int DisplayOrder { get; init; }
    public byte Level { get; init; }
    public bool IsActive { get; init; }
    public List<SpecialtyTreeNodeDto> Children { get; set; } = [];
}

/// <summary>Rezultatul SP-ului GetTree — 3 liste (categorii, specialități, subspecialități).</summary>
public sealed class SpecialtyTreeResult
{
    public IEnumerable<SpecialtyTreeNodeDto> Categories { get; init; } = [];
    public IEnumerable<SpecialtyTreeNodeDto> Specialties { get; init; } = [];
    public IEnumerable<SpecialtyTreeNodeDto> Subspecialties { get; init; } = [];
}
