namespace ValyanClinic.Application.Features.Invoices.DTOs;

/// <summary>IsDuplicate = retry cu aceeași cheie de idempotență — factura exista deja.</summary>
public sealed class CreateInvoiceResult
{
    public Guid InvoiceId { get; init; }
    public bool IsDuplicate { get; init; }
}
