using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Features.Invoices.Queries.GetInvoices;

public sealed class GetInvoicesQueryHandler(
    IInvoiceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetInvoicesQuery, Result<InvoicesPagedResponse>>
{
    public async Task<Result<InvoicesPagedResponse>> Handle(GetInvoicesQuery request, CancellationToken cancellationToken)
    {
        var filter = new InvoiceFilterData(
            request.Search, request.StatusId, request.DateFrom, request.DateTo,
            request.Page, request.PageSize, request.SortBy, request.SortDir);

        var result = await repository.GetPagedAsync(currentUser.ClinicId, filter, cancellationToken);

        return Result<InvoicesPagedResponse>.Success(new InvoicesPagedResponse
        {
            PagedResult = result.Paged,
            Stats = result.Stats,
        });
    }
}
