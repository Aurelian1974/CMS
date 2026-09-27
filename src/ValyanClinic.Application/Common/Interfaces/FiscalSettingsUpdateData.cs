using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public sealed record FiscalSettingsUpdateData(
    Guid ClinicId,
    bool IsEnabled,
    string BridgeUrl,
    bool IsVatPayer,
    IReadOnlyList<FiscalVatMappingInput> VatMappings,
    IReadOnlyList<FiscalPaymentMappingInput> PaymentMappings);
