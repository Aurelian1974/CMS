namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>Octeții de control ai protocolului Datecs „clasic" (DP-25 / DP-05 / FP-550, nu modelele „X").</summary>
internal static class DatecsControl
{
    public const byte Preamble   = 0x01;
    public const byte Postamble  = 0x03;
    public const byte Separator  = 0x04;
    public const byte Terminator = 0x05;
    public const byte Nak        = 0x15;
    public const byte Syn        = 0x16;

    /// <summary>Offset-ul adăugat la lungime, secvență și cod de comandă.</summary>
    public const byte Offset = 0x20;

    public const byte MinSequence = 0x20;
    public const byte MaxSequence = 0x7F;

    public const int StatusLength = 6;
    public const int ChecksumLength = 4;

    /// <summary>Lungimea maximă a datelor dintr-o comandă.</summary>
    public const int MaxDataLength = 213;

    /// <summary>Lungimea maximă acceptată pentru un răspuns (protecție contra zgomotului pe linie).</summary>
    public const int MaxResponseLength = 512;
}
