namespace ValyanClinic.Application.Features.Invoices.DTOs;

/// <summary>Factură în contextul unei consultații (ecranul de încasare).</summary>
public sealed class InvoiceSummaryDto
{
    public Guid Id { get; init; }
    public string Series { get; init; } = string.Empty;
    public int Number { get; init; }
    public DateOnly IssueDate { get; init; }
    public decimal Total { get; init; }
    public bool IsStorno { get; init; }
    public Guid? OriginalInvoiceId { get; init; }
    public Guid StatusId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
}
