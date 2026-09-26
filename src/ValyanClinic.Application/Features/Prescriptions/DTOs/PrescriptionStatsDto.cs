namespace ValyanClinic.Application.Features.Prescriptions.DTOs;

/// <summary>Statistici rețete la nivel de clinică.</summary>
public sealed class PrescriptionStatsDto
{
    public int TotalPrescriptions { get; init; }
    public int CompensatedCount { get; init; }
    public int SimpleCount { get; init; }
    public int DraftCount { get; init; }
    public int IssuedThisMonth { get; init; }
}
