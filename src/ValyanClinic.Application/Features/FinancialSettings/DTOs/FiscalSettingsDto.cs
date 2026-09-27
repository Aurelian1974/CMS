namespace ValyanClinic.Application.Features.FinancialSettings.DTOs;

/// <summary>
/// Setările financiare ale clinicii. Portul / viteza / parola operatorului casei de marcat
/// nu sunt aici: stau în configurația fiscal bridge-ului de pe PC-ul de recepție.
/// </summary>
public sealed record FiscalSettingsDto
{
    public bool IsEnabled { get; init; }
    public string BridgeUrl { get; init; } = string.Empty;
    public bool IsVatPayer { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public IReadOnlyList<FiscalVatMappingDto> VatMappings { get; init; } = [];
    public IReadOnlyList<FiscalPaymentMappingDto> PaymentMappings { get; init; } = [];
}
