namespace ValyanClinic.FiscalBridge.Printing;

public sealed record PrintResult
{
    public required PrintOutcome Outcome { get; init; }
    public string? ReceiptNumber { get; init; }
    public string? DeviceSerialNumber { get; init; }
    public DateTime? PrintedAt { get; init; }
    public string? ErrorMessage { get; init; }

    /// <summary>Răspunsul brut al aparatului (diagnostic, salvat în evenimentele bonului).</summary>
    public string? DeviceResponse { get; init; }

    /// <summary>Rezultat preluat din jurnal — aparatul nu a fost apelat din nou.</summary>
    public bool IsReplay { get; init; }

    public static PrintResult Failed(string error, string? deviceResponse = null) =>
        new() { Outcome = PrintOutcome.Failed, ErrorMessage = error, DeviceResponse = deviceResponse };

    public static PrintResult Unknown(string error, string? deviceResponse = null) =>
        new() { Outcome = PrintOutcome.Unknown, ErrorMessage = error, DeviceResponse = deviceResponse };
}
