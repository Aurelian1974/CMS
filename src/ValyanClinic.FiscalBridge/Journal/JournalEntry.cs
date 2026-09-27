namespace ValyanClinic.FiscalBridge.Journal;

/// <summary>Înregistrarea persistentă a unui bon (un fișier JSON per job).</summary>
public sealed record JournalEntry
{
    public required Guid JobId { get; init; }

    /// <summary>Amprenta conținutului bonului — același job cu alt conținut e respins.</summary>
    public required string PayloadHash { get; init; }

    public required JournalState State { get; init; }
    public int Attempts { get; init; }
    public string? ReceiptNumber { get; init; }
    public string? DeviceSerialNumber { get; init; }
    public DateTime? PrintedAt { get; init; }
    public string? ErrorMessage { get; init; }
    public string? DeviceResponse { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public IReadOnlyList<JournalEvent> History { get; init; } = [];
}
