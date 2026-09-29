namespace ValyanClinic.FiscalBridge.Configuration;

/// <summary>Setările serviciului HTTP local (secțiunea „Bridge" din appsettings.json).</summary>
public sealed class BridgeOptions
{
    public const string SectionName = "Bridge";

    /// <summary>Portul pe care ascultă pe 127.0.0.1 — trebuie să coincidă cu adresa din Setări financiare.</summary>
    public int Port { get; init; } = 5199;

    /// <summary>Originile aplicației ValyanClinic care pot apela bridge-ul din browser (CORS).</summary>
    public string[] AllowedOrigins { get; init; } = [];

    /// <summary>Cheia publică (PEM) a serverului ValyanClinic — verifică tichetele de asociere emise pentru administratori.</summary>
    public string PairingPublicKey { get; init; } = string.Empty;

    /// <summary>Director pentru jurnalul bonurilor și secrete. Gol = %ProgramData%\ValyanClinic\FiscalBridge.</summary>
    public string DataDirectory { get; init; } = string.Empty;

    public string ResolveDataDirectory() => string.IsNullOrWhiteSpace(DataDirectory)
        ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "ValyanClinic", "FiscalBridge")
        : DataDirectory;
}
