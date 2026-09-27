namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>Un răspuns valid (sumă de control corectă) al aparatului.</summary>
public sealed record DatecsResponse(byte Sequence, byte Command, byte[] Data, DatecsStatus Status);
