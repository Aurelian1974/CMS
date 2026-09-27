using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Invoices.DTOs;

public sealed class InvoicesPagedResponse
{
    public required PagedResult<InvoiceListDto> PagedResult { get; init; }
    public required InvoiceStatsDto Stats { get; init; }
}
