namespace ValyanClinic.FiscalBridge.Journal;

public sealed record JournalEvent(DateTime At, JournalState State, string? Message);
