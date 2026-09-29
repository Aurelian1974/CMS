namespace ValyanClinic.Infrastructure.Configuration;

/// <summary>Asocierea stațiilor cu fiscal bridge-ul local (secțiunea „FiscalBridge").</summary>
public sealed class FiscalBridgeOptions
{
    public const string SectionName = "FiscalBridge";

    /// <summary>Cheia privată ECDSA P-256 (PEM) cu care se semnează tichetele. Se ține în user-secrets / variabile de mediu.</summary>
    public string PairingPrivateKey { get; init; } = string.Empty;

    /// <summary>Cât timp poate fi folosit un tichet de asociere.</summary>
    public int PairingTicketLifetimeSeconds { get; init; } = 60;
}
