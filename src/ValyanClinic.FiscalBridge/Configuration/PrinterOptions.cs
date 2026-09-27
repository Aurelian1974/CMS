namespace ValyanClinic.FiscalBridge.Configuration;

/// <summary>
/// Conexiunea cu casa de marcat (secțiunea „Printer"). Parola operatorului NU stă aici —
/// se salvează criptat (DPAPI) cu <c>--set-operator-password</c>.
/// </summary>
public sealed class PrinterOptions
{
    public const string SectionName = "Printer";

    /// <summary>„Mock" (dezvoltare / teste) sau „Datecs".</summary>
    public string Driver { get; init; } = PrinterDrivers.Mock;

    /// <summary>„Serial" (COM / USB-COM) sau „Tcp" (modelele cu LAN).</summary>
    public string Transport { get; init; } = PrinterTransports.Serial;

    public string PortName { get; init; } = "COM1";
    public int BaudRate { get; init; } = 115200;

    public string Host { get; init; } = string.Empty;
    public int TcpPort { get; init; } = 4999;

    /// <summary>Codul operatorului programat în aparat.</summary>
    public string OperatorCode { get; init; } = "1";

    /// <summary>Numărul casei (punctul de lucru) programat în aparat.</summary>
    public string TillNumber { get; init; } = "1";

    /// <summary>Timpul maxim de așteptare a unui răspuns (fără SYN) — ms.</summary>
    public int ResponseTimeoutMs { get; init; } = 1000;

    /// <summary>Timpul maxim total pentru o comandă cât aparatul trimite SYN (tipărire lentă) — ms.</summary>
    public int BusyTimeoutMs { get; init; } = 15000;

    /// <summary>Retrimiteri la NAK (sumă de control greșită) — doar atunci e sigur că aparatul n-a executat comanda.</summary>
    public int MaxNakRetries { get; init; } = 3;

    /// <summary>Codificarea textului trimis aparatului (diacritice).</summary>
    public string TextEncoding { get; init; } = "windows-1250";

    /// <summary>Lungimea maximă a denumirii articolului pe bon.</summary>
    public int MaxItemNameLength { get; init; } = 36;

    /// <summary>Scenariul simulat de MockFiscalPrinter (None, PaperOut, CoverOpen, Offline, DeviceErrorOnSale, TimeoutAfterClose).</summary>
    public string MockScenario { get; init; } = "None";
}
