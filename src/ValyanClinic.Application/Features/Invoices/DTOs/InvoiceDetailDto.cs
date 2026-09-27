namespace ValyanClinic.Application.Features.Invoices.DTOs;

public sealed record InvoiceDetailDto
{
    public Guid Id { get; init; }
    public Guid ConsultationId { get; init; }
    public Guid PatientId { get; init; }
    public string Series { get; init; } = string.Empty;
    public int Number { get; init; }
    public DateOnly IssueDate { get; init; }
    public DateTime IssuedAt { get; init; }
    public string InvoiceTypeCode { get; init; } = string.Empty;
    public bool IsStorno { get; init; }
    public Guid? OriginalInvoiceId { get; init; }
    public string? OriginalSeries { get; init; }
    public int? OriginalNumber { get; init; }
    public DateOnly? OriginalIssueDate { get; init; }
    public string? StornoReason { get; init; }
    public Guid? StornoInvoiceId { get; init; }
    public string? StornoSeries { get; init; }
    public int? StornoNumber { get; init; }
    public Guid StatusId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public string Currency { get; init; } = string.Empty;
    public string SupplierName { get; init; } = string.Empty;
    public string SupplierFiscalCode { get; init; } = string.Empty;
    public string? SupplierTradeRegisterNumber { get; init; }
    public string? SupplierAddress { get; init; }
    public string? SupplierCity { get; init; }
    public string? SupplierCounty { get; init; }
    public string? SupplierBankName { get; init; }
    public string? SupplierBankAccount { get; init; }
    public bool SupplierIsVatPayer { get; init; }
    public bool CustomerIsLegalEntity { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string? CustomerCnp { get; init; }
    public string? CustomerFiscalCode { get; init; }
    public string? CustomerTradeRegisterNumber { get; init; }
    public string? CustomerAddress { get; init; }
    public string? CustomerCity { get; init; }
    public string? CustomerCounty { get; init; }
    public string CustomerCountryCode { get; init; } = string.Empty;
    public decimal TotalNet { get; init; }
    public decimal TotalVat { get; init; }
    public decimal Total { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? CreatedByName { get; init; }
    public IReadOnlyList<InvoiceLineDto> Lines { get; init; } = [];
}
