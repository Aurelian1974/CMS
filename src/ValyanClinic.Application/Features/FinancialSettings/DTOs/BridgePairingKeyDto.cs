namespace ValyanClinic.Application.Features.FinancialSettings.DTOs;

public sealed class BridgePairingKeyDto
{
    public bool IsConfigured { get; init; }
    public string? PublicKeyPem { get; init; }
}
