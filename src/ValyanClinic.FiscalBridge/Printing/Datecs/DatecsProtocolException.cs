namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>Cadru invalid (lungime, delimitatori, sumă de control).</summary>
public sealed class DatecsProtocolException(string message) : Exception(message);
