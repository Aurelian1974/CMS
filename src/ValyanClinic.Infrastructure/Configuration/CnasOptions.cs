namespace ValyanClinic.Infrastructure.Configuration;

/// <summary>
/// Opțiuni pentru sincronizarea nomenclatoarelor CNAS (farmacii).
/// </summary>
public sealed class CnasOptions
{
    public const string SectionName = "Cnas";

    /// <summary>Pagina CNAS de pe care se scrapează URL-urile fișierelor ZIP.</summary>
    public string NomenclatorPageUrl { get; init; } = "https://cnas.ro/siui/";

    /// <summary>Ziua din lună la care se declanșează sincronizarea automată.</summary>
    public int SyncDayOfMonth { get; init; } = 2;

    /// <summary>Ora (UTC) la care se declanșează sincronizarea automată.</summary>
    public int SyncHour { get; init; } = 8;

    /// <summary>Folder temporar pentru descărcarea ZIP-urilor CNAS.</summary>
    public string TempDownloadPath { get; init; } = Path.GetTempPath();
}
