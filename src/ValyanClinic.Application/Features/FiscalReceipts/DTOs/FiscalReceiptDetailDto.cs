namespace ValyanClinic.Application.Features.FiscalReceipts.DTOs;

/// <summary>
/// Bonul fiscal complet. Liniile + plățile formează și payload-ul trimis la fiscal bridge
/// (Id-ul bonului e cheia de idempotență a jobului de tipărire).
/// </summary>
public sealed record FiscalReceiptDetailDto
{
    public Guid Id { get; init; }
    public Guid ConsultationId { get; init; }
    public Guid PaymentId { get; init; }
    public Guid StatusId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string? ReceiptNumber { get; init; }
    public string? DeviceSerialNumber { get; init; }
    public DateTime? PrintedAt { get; init; }
    public int AttemptCount { get; init; }
    public string? LastError { get; init; }
    public bool IsManuallyReconciled { get; init; }
    public string? ReconciliationNote { get; init; }
    public DateTime? ReconciledAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public IReadOnlyList<FiscalReceiptLineDto> Lines { get; init; } = [];
    public IReadOnlyList<FiscalReceiptTenderDto> Tenders { get; init; } = [];
    public IReadOnlyList<FiscalReceiptEventDto> Events { get; init; } = [];
}
