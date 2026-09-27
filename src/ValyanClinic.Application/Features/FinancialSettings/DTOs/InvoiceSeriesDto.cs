namespace ValyanClinic.Application.Features.FinancialSettings.DTOs;

public sealed class InvoiceSeriesDto
{
    public Guid Id { get; init; }
    public string Series { get; init; } = string.Empty;
    public int LastNumber { get; init; }
    public bool IsDefault { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public int InvoiceCount { get; init; }
}
