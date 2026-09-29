namespace ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

/// <summary>Funcție administrativă (nomenclator).</summary>
public sealed class AdministrativePositionDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public bool IsActive { get; init; }
}
