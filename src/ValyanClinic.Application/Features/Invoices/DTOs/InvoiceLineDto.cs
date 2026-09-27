namespace ValyanClinic.Application.Features.Invoices.DTOs;

public sealed class InvoiceLineDto
{
    public Guid Id { get; init; }
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public string UnitCode { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal LineTotal { get; init; }
    public Guid VatRateId { get; init; }
    public decimal VatPercent { get; init; }
    public string VatCategoryCode { get; init; } = string.Empty;
    public string? VatExemptionReasonCode { get; init; }
    public string? VatExemptionReasonText { get; init; }
    public decimal VatAmount { get; init; }
    public decimal NetAmount { get; init; }
    public int SortOrder { get; init; }
}
