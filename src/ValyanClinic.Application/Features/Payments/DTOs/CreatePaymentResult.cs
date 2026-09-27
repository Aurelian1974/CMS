namespace ValyanClinic.Application.Features.Payments.DTOs;

/// <summary>IsDuplicate = retry cu aceeași cheie de idempotență — nu s-a creat nimic nou.</summary>
public sealed class CreatePaymentResult
{
    public Guid PaymentId { get; init; }
    public Guid? FiscalReceiptId { get; init; }
    public bool IsDuplicate { get; init; }
}
