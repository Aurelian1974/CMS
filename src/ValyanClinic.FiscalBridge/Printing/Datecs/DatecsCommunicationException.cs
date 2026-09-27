namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>
/// Nu s-a primit un răspuns valid. Comanda poate să fi fost sau nu executată —
/// apelantul tratează rezultatul ca necunoscut dacă nu îl poate verifica altfel.
/// </summary>
public sealed class DatecsCommunicationException(string message, Exception? inner = null) : Exception(message, inner);
