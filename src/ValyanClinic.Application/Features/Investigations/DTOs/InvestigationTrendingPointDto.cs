namespace ValyanClinic.Application.Features.Investigations.DTOs;

/// <summary>Punct de date pentru un grafic de tip trending.</summary>
public sealed class InvestigationTrendingPointDto
{
    public DateTime InvestigationDate { get; init; }
    public string ParameterPath { get; init; } = string.Empty;
    public decimal? Value { get; init; }
    public Guid InvestigationId { get; init; }
}
