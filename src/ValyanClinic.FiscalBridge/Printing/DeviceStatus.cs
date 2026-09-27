namespace ValyanClinic.FiscalBridge.Printing;

/// <summary>Starea aparatului, interogată înainte de fiecare bon și la reconciliere.</summary>
public sealed record DeviceStatus
{
    public bool IsConnected { get; init; }
    public bool PaperOut { get; init; }
    public bool CoverOpen { get; init; }
    public bool FiscalReceiptOpen { get; init; }
    public bool NonFiscalReceiptOpen { get; init; }
    public bool PrinterFailure { get; init; }
    public string? SerialNumber { get; init; }
    public string? Model { get; init; }
    public string? RawStatus { get; init; }

    /// <summary>Motive pentru care nu se poate tipări acum — afișate recepției.</summary>
    public IReadOnlyList<string> Problems { get; init; } = [];

    public bool IsReady => IsConnected && Problems.Count == 0;

    public static DeviceStatus Offline(string reason) => new() { IsConnected = false, Problems = [reason] };
}
