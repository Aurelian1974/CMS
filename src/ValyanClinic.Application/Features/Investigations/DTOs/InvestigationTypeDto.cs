namespace ValyanClinic.Application.Features.Investigations.DTOs;

public sealed class InvestigationTypeDto
{
    public string TypeCode { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string? DisplayNameEn { get; init; }
    public string Category { get; init; } = string.Empty;
    public string ParentTab { get; init; } = string.Empty;
    public string UIPattern { get; init; } = string.Empty;
    public string Specialties { get; init; } = string.Empty;
    public bool HasStructuredFields { get; init; }
    public bool DefaultStructuredEntry { get; init; }
    public string JsonSchemaVersion { get; init; } = "1.0";
    public bool IsActive { get; init; }
    public int SortOrder { get; init; }
}
