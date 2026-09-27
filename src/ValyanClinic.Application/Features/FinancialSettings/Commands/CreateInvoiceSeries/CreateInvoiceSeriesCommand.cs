using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.CreateInvoiceSeries;

public sealed record CreateInvoiceSeriesCommand(string Series, int StartNumber, bool IsDefault) : IRequest<Result<Guid>>;
