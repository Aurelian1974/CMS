using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Features.Invoices.Queries.GetInvoices;

public sealed record GetInvoicesQuery(
    string? Search,
    Guid? StatusId,
    DateOnly? DateFrom,
    DateOnly? DateTo,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "IssueDate",
    string SortDir = "desc")
    : IRequest<Result<InvoicesPagedResponse>>;
