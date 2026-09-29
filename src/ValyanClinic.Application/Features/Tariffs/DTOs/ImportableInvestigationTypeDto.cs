namespace ValyanClinic.Application.Features.Tariffs.DTOs;

/// <summary>Tip de investigație facturabil care nu are încă un serviciu în tarifele clinicii.</summary>
public sealed class ImportableInvestigationTypeDto
{
    public string TypeCode { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string? Category { get; init; }
    public string ParentTab { get; init; } = string.Empty;
    public int SortOrder { get; init; }
}
