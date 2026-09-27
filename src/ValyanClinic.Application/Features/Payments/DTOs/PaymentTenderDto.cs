namespace ValyanClinic.Application.Features.Payments.DTOs;

public sealed class PaymentTenderDto
{
    public Guid PaymentId { get; init; }
    public Guid PaymentMethodId { get; init; }
    public string PaymentMethodCode { get; init; } = string.Empty;
    public string PaymentMethodName { get; init; } = string.Empty;
    public decimal Amount { get; init; }
}
