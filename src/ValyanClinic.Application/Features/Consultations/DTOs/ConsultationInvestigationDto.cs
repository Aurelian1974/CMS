namespace ValyanClinic.Application.Features.Consultations.DTOs;

/// <summary>Investigație paraclinică returnată în contextul detaliului unei consultații.</summary>
public sealed class ConsultationInvestigationDto
{
    public Guid Id { get; init; }
    public string InvestigationType { get; init; } = string.Empty;
    public string InvestigationTypeDisplayName { get; init; } = string.Empty;
    public string ParentTab { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public DateTime InvestigationDate { get; init; }
    public string? Narrative { get; init; }
    public string? StructuredData { get; init; }
    public bool IsExternal { get; init; }
    public string? ExternalSource { get; init; }
    public byte Status { get; init; }
}
