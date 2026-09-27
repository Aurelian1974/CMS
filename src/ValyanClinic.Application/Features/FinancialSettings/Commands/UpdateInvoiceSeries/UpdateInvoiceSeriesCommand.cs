using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.UpdateInvoiceSeries;

/// <summary>Doar implicit / activ — textul seriei și contorul sunt imuabile.</summary>
public sealed record UpdateInvoiceSeriesCommand(Guid Id, bool IsDefault, bool IsActive) : IRequest<Result<bool>>;
