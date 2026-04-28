namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Definiția unui tip de investigație paraclinică (ex: Spirometry, ECG, Holter_BP).
/// </summary>
public sealed class InvestigationTypeDefinition
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
