namespace ValyanClinic.Application.Features.FinancialSettings.DTOs;

public sealed class FiscalPaymentMappingDto
{
    public Guid PaymentMethodId { get; init; }
    public string PaymentMethodCode { get; init; } = string.Empty;
    public string PaymentMethodName { get; init; } = string.Empty;
    public string? DevicePaymentCode { get; init; }
}
