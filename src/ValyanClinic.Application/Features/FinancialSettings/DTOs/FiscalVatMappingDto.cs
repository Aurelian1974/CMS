namespace ValyanClinic.Application.Features.FinancialSettings.DTOs;

public sealed class FiscalVatMappingDto
{
    public Guid VatRateId { get; init; }
    public string VatRateCode { get; init; } = string.Empty;
    public string VatRateName { get; init; } = string.Empty;
    public decimal Percent { get; init; }
    public string? TaxGroup { get; init; }
}
