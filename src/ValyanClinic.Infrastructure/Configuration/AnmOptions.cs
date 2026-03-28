namespace ValyanClinic.Infrastructure.Configuration;

/// <summary>
/// Opțiuni pentru sincronizarea nomenclatorului ANM
/// (Agenția Națională a Medicamentului și a Dispozitivelor Medicale).
/// </summary>
public sealed class AnmOptions
{
    public const string SectionName = "Anm";

    /// <summary>URL-ul fișierului Excel cu nomenclatorul medicamentelor omologate.</summary>
    public string ExcelUrl { get; init; } = "https://nomenclator.anm.ro/files/nomenclator.xlsx";

    /// <summary>Ziua din lună la care se declanșează sincronizarea automată (0 = dezactivat).</summary>
    public int SyncDayOfMonth { get; init; } = 5;

    /// <summary>Ora (UTC) la care se declanșează sincronizarea automată.</summary>
    public int SyncHour { get; init; } = 6;

    /// <summary>Folder temporar pentru descărcarea fișierului Excel.</summary>
    public string TempDownloadPath { get; init; } = Path.GetTempPath();
}
