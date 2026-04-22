namespace ValyanClinic.Application.Features.Consultations.DTOs;

/// <summary>Statistici consultații — result set suplimentar din Consultation_GetPaged.</summary>
public sealed class ConsultationStatsDto
{
    public int TotalConsultations { get; init; }
    public int DraftCount { get; init; }
    public int CompletedCount { get; init; }
    public int LockedCount { get; init; }
}
