namespace ValyanClinic.Application.Features.Payments.DTOs;

public sealed record PaymentDto
{
    public Guid Id { get; init; }
    public decimal Amount { get; init; }
    public DateTime PaidAt { get; init; }
    public string? Notes { get; init; }
    public bool IsCancelled { get; init; }
    public string? CancelReason { get; init; }
    public DateTime? CancelledAt { get; init; }
    public string? OperatorName { get; init; }
    public Guid? FiscalReceiptId { get; init; }
    public IReadOnlyList<PaymentTenderDto> Tenders { get; init; } = [];
}
