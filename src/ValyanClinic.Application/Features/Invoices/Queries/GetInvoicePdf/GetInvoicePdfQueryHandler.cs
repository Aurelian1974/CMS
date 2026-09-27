using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Features.Invoices.Queries.GetInvoicePdf;

public sealed class GetInvoicePdfQueryHandler(
    IInvoiceRepository repository,
    IInvoicePdfGenerator pdfGenerator,
    ICurrentUser currentUser)
    : IRequestHandler<GetInvoicePdfQuery, Result<InvoicePdfFile>>
{
    public async Task<Result<InvoicePdfFile>> Handle(GetInvoicePdfQuery request, CancellationToken cancellationToken)
    {
        var invoice = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);
        if (invoice is null)
            return Result<InvoicePdfFile>.NotFound(ErrorMessages.Invoice.NotFound);

        var fileName = $"factura_{invoice.Series}_{invoice.Number}.pdf";
        return Result<InvoicePdfFile>.Success(new InvoicePdfFile(pdfGenerator.Generate(invoice), fileName));
    }
}
