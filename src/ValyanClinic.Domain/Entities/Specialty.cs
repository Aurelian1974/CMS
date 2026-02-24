namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Entitate Domain pentru specializare medicală (ierarhic: categorie → specializare → subspecializare).
/// </summary>
public sealed class Specialty
{
    public Guid Id { get; init; }
    public Guid? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public byte Level { get; set; }     // 0=categorie, 1=specialitate, 2=subspecialitate
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; set; }
}
