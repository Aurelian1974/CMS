using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public sealed record InvoicePagedResult(
    PagedResult<InvoiceListDto> Paged,
    InvoiceStatsDto Stats);
