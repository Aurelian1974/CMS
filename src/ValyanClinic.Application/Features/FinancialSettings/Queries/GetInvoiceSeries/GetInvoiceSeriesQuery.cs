using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Features.FinancialSettings.Queries.GetInvoiceSeries;

public sealed record GetInvoiceSeriesQuery : IRequest<Result<IReadOnlyList<InvoiceSeriesDto>>>;
