namespace ValyanClinic.Application.Features.FiscalReceipts.DTOs;

public sealed class FiscalReceiptEventDto
{
    public Guid Id { get; init; }
    public Guid? FromStatusId { get; init; }
    public string? FromStatusCode { get; init; }
    public Guid ToStatusId { get; init; }
    public string ToStatusCode { get; init; } = string.Empty;
    public string? Message { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? CreatedByName { get; init; }
}
