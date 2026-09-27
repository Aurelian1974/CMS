namespace ValyanClinic.Application.Features.FiscalReceipts.DTOs;

public sealed class FiscalReceiptTenderDto
{
    public Guid PaymentMethodId { get; init; }
    public string PaymentMethodCode { get; init; } = string.Empty;
    public string PaymentMethodName { get; init; } = string.Empty;
    /// <summary>Codul tipului de plată în casa de marcat (din maparea din Setări financiare).</summary>
    public string? DevicePaymentCode { get; init; }
    public decimal Amount { get; init; }
}
