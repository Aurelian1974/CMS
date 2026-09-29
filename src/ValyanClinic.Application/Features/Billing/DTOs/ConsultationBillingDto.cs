using ValyanClinic.Application.Features.ConsultationServices.DTOs;
using ValyanClinic.Application.Features.FiscalReceipts.DTOs;
using ValyanClinic.Application.Features.Invoices.DTOs;
using ValyanClinic.Application.Features.Payments.DTOs;

namespace ValyanClinic.Application.Features.Billing.DTOs;

/// <summary>
/// Situația financiară a unei consultații, pentru recepție — fără date clinice.
/// CNP-ul nu se expune; <see cref="PatientHasCnp"/> spune doar dacă poate fi inclus pe factură.
/// </summary>
public sealed record ConsultationBillingDto
{
    public Guid ConsultationId { get; init; }
    public DateTime Date { get; init; }
    public Guid StatusId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string? PatientAddress { get; init; }
    public string? PatientCity { get; init; }
    public string? PatientCounty { get; init; }
    public bool PatientHasCnp { get; init; }
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public decimal Total { get; init; }
    public decimal Paid { get; init; }
    public decimal Balance { get; init; }
    public string PaymentStatus { get; init; } = string.Empty;
    public bool CanEditServices { get; init; }
    public bool CanCollect { get; init; }
    public bool CanInvoice { get; init; }
    public IReadOnlyList<ConsultationServiceDto> Lines { get; init; } = [];
    public IReadOnlyList<PaymentDto> Payments { get; init; } = [];
    public IReadOnlyList<FiscalReceiptListDto> FiscalReceipts { get; init; } = [];
    public IReadOnlyList<InvoiceSummaryDto> Invoices { get; init; } = [];
    public IReadOnlyList<UnbilledInvestigationDto> UnbilledInvestigations { get; init; } = [];
}
