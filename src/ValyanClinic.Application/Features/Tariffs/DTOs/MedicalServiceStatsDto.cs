namespace ValyanClinic.Application.Features.Tariffs.DTOs;

public sealed class MedicalServiceStatsDto
{
    public int TotalCount { get; init; }
    public int ActiveCount { get; init; }
    public int InactiveCount { get; init; }
}
