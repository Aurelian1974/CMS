namespace ValyanClinic.Application.Features.Tariffs.DTOs;

/// <summary>O versiune din istoricul de prețuri; ValidTo este exclusiv (NULL = fără sfârșit).</summary>
public sealed class MedicalServicePriceDto
{
    public Guid Id { get; init; }
    public decimal Price { get; init; }
    public Guid VatRateId { get; init; }
    public string VatRateName { get; init; } = string.Empty;
    public decimal VatPercent { get; init; }
    public DateOnly ValidFrom { get; init; }
    public DateOnly? ValidTo { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? CreatedByName { get; init; }
    public bool IsCurrent { get; init; }
}
