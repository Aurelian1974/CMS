namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Entitate Domain pentru titulatură personal medical (ex: medic, medic specialist, asistent medical etc.).
/// </summary>
public sealed class MedicalTitle
{
    public Guid Id { get; init; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; set; }
}
