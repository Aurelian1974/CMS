namespace ValyanClinic.Application.Features.FinancialSettings.DTOs;

public sealed record FiscalPaymentMappingInput(Guid PaymentMethodId, string DevicePaymentCode);
