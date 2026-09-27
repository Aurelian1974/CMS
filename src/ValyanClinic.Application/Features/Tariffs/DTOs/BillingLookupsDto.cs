namespace ValyanClinic.Application.Features.Tariffs.DTOs;

/// <summary>Nomenclatoarele modulului financiar, livrate într-un singur apel.</summary>
public sealed class BillingLookupsDto
{
    public IReadOnlyList<ServiceCategoryDto> ServiceCategories { get; init; } = [];
    public IReadOnlyList<VatRateDto> VatRates { get; init; } = [];
    public IReadOnlyList<PaymentMethodDto> PaymentMethods { get; init; } = [];
    public IReadOnlyList<InvoiceSeriesLookupDto> InvoiceSeries { get; init; } = [];
}
