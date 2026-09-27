namespace ValyanClinic.FiscalBridge.Journal;

/// <summary>Câmpurile care se schimbă la o tranziție de stare în jurnal.</summary>
public sealed class JournalUpdate
{
    public string? ReceiptNumber { get; set; }
    public string? DeviceSerialNumber { get; set; }
    public DateTime? PrintedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? DeviceResponse { get; set; }
}
