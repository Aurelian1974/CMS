namespace ValyanClinic.Application.Features.Billing.DTOs;

/// <summary>Rând în lista de încasări a recepției (fără date clinice).</summary>
public sealed class BillingConsultationListDto
{
    public Guid ConsultationId { get; init; }
    public DateTime Date { get; init; }
    public Guid StatusId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string DoctorName { get; init; } = string.Empty;
    public decimal Total { get; init; }
    public decimal Paid { get; init; }
    public decimal Balance { get; init; }
    public string PaymentStatus { get; init; } = string.Empty;
    public string? InvoiceNumber { get; init; }
    public string? ReceiptStatusCode { get; init; }
    public string? ReceiptStatusName { get; init; }
}
