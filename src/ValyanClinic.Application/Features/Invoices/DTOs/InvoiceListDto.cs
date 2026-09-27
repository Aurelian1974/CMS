namespace ValyanClinic.Application.Features.Invoices.DTOs;

public sealed class InvoiceListDto
{
    public Guid Id { get; init; }
    public Guid ConsultationId { get; init; }
    public string Series { get; init; } = string.Empty;
    public int Number { get; init; }
    public DateOnly IssueDate { get; init; }
    public bool IsStorno { get; init; }
    public Guid? OriginalInvoiceId { get; init; }
    public Guid StatusId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public bool CustomerIsLegalEntity { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string? CustomerFiscalCode { get; init; }
    public decimal TotalNet { get; init; }
    public decimal TotalVat { get; init; }
    public decimal Total { get; init; }
    public DateTime CreatedAt { get; init; }
}
