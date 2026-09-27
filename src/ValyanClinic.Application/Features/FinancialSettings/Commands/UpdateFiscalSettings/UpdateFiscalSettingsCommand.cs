using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.UpdateFiscalSettings;

public sealed record UpdateFiscalSettingsCommand(
    bool IsEnabled,
    string BridgeUrl,
    bool IsVatPayer,
    IReadOnlyList<FiscalVatMappingInput> VatMappings,
    IReadOnlyList<FiscalPaymentMappingInput> PaymentMappings)
    : IRequest<Result<bool>>;
