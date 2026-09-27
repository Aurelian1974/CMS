using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Features.Invoices.Queries.GetInvoiceById;

public sealed class GetInvoiceByIdQueryHandler(
    IInvoiceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetInvoiceByIdQuery, Result<InvoiceDetailDto>>
{
    public async Task<Result<InvoiceDetailDto>> Handle(GetInvoiceByIdQuery request, CancellationToken cancellationToken)
    {
        var invoice = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);
        return invoice is null
            ? Result<InvoiceDetailDto>.NotFound(ErrorMessages.Invoice.NotFound)
            : Result<InvoiceDetailDto>.Success(invoice);
    }
}
