namespace ValyanClinic.Application.Features.Tariffs.DTOs;

/// <summary>Tip de investigație facturabil; ExistingServiceCode e completat dacă are deja serviciu în tarife.</summary>
public sealed class ImportableInvestigationTypeDto
{
    public Guid InvestigationTypeId { get; init; }
    public string TypeCode { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string? Category { get; init; }
    public string ParentTab { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public string? ExistingServiceCode { get; init; }
    public bool? ExistingServiceIsActive { get; init; }
}
