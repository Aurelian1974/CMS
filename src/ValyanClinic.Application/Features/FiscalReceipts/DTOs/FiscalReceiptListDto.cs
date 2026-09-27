namespace ValyanClinic.Application.Features.FiscalReceipts.DTOs;

public sealed class FiscalReceiptListDto
{
    public Guid Id { get; init; }
    public Guid PaymentId { get; init; }
    public Guid StatusId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string? ReceiptNumber { get; init; }
    public DateTime? PrintedAt { get; init; }
    public int AttemptCount { get; init; }
    public string? LastError { get; init; }
    public bool IsManuallyReconciled { get; init; }
    public DateTime CreatedAt { get; init; }
}
