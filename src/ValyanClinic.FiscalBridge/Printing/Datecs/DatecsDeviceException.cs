namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>Aparatul a răspuns, dar a respins comanda — știm sigur că n-a executat-o.</summary>
public sealed class DatecsDeviceException(byte command, DatecsStatus status)
    : Exception($"Aparatul a respins comanda 0x{command:X2}: {string.Join(" ", status.Describe())}")
{
    public byte Command { get; } = command;
    public DatecsStatus Status { get; } = status;
}
