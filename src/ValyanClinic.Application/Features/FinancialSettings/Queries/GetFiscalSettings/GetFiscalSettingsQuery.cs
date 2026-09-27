using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Features.FinancialSettings.Queries.GetFiscalSettings;

public sealed record GetFiscalSettingsQuery : IRequest<Result<FiscalSettingsDto>>;
