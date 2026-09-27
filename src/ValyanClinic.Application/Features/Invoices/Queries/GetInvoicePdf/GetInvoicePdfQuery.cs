using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Features.Invoices.Queries.GetInvoicePdf;

public sealed record GetInvoicePdfQuery(Guid Id) : IRequest<Result<InvoicePdfFile>>;
