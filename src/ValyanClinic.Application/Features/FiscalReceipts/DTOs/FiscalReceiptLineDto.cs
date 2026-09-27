namespace ValyanClinic.Application.Features.FiscalReceipts.DTOs;

public sealed class FiscalReceiptLineDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public decimal UnitPrice { get; init; }
    public decimal Quantity { get; init; }
    public decimal LineTotal { get; init; }
    public Guid VatRateId { get; init; }
    /// <summary>Grupa de TVA exact cum e programată în casa de marcat.</summary>
    public string TaxGroup { get; init; } = string.Empty;
    public int SortOrder { get; init; }
}
