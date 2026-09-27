namespace ValyanClinic.Application.Features.Tariffs.DTOs;

public sealed class InvoiceSeriesLookupDto
{
    public Guid Id { get; init; }
    public string Series { get; init; } = string.Empty;
    public int LastNumber { get; init; }
    public bool IsDefault { get; init; }
}
