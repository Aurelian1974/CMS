namespace ValyanClinic.Application.Features.RecommendedAnalyses.DTOs;

/// <summary>Analiză recomandată asociată unei consultații.</summary>
public sealed record RecommendedAnalysisDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid ConsultationId { get; init; }
    public Guid PatientId { get; init; }
    public Guid AnalysisId { get; init; }
    public string AnalysisName { get; init; } = string.Empty;
    public string? AnalysisCategory { get; init; }
    public string? AnalysisSubcategory { get; init; }
    public byte Priority { get; init; }      // 0=Low,1=Normal,2=High,3=Urgent
    public string? Notes { get; init; }
    public byte Status { get; init; }        // 0=Pending,1=Done,2=Cancelled
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public Guid? UpdatedBy { get; init; }
}

/// <summary>Element din dicționarul de analize (Synevo) pentru typeahead.</summary>
public sealed record AnalysisDictionaryDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Category { get; init; }
    public string? Subcategory { get; init; }
    public string? Slug { get; init; }
}
