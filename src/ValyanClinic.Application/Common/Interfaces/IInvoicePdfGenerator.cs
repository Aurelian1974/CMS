using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IInvoicePdfGenerator
{
    byte[] Generate(InvoiceDetailDto invoice);
}
