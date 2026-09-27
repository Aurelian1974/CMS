namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>
/// Cei 6 octeți de status din fiecare răspuns. Semnificația biților e din documentația
/// protocolului clasic — NEVERIFICAT PE APARAT pentru modelul exact.
/// </summary>
public sealed class DatecsStatus
{
    private readonly byte[] _bytes;

    public DatecsStatus(ReadOnlySpan<byte> bytes)
    {
        if (bytes.Length != DatecsControl.StatusLength)
            throw new ArgumentException($"Statusul are {DatecsControl.StatusLength} octeți.", nameof(bytes));
        _bytes = bytes.ToArray();
    }

    private bool Bit(int b, int bit) => (_bytes[b] & (1 << bit)) != 0;

    // Octetul 0
    public bool SyntaxError       => Bit(0, 0);
    public bool InvalidCommand    => Bit(0, 1);
    public bool ClockNotSet       => Bit(0, 2);
    public bool PrinterFailure    => Bit(0, 4);
    public bool GeneralError      => Bit(0, 5);
    public bool CoverOpen         => Bit(0, 6);

    // Octetul 1
    public bool Overflow             => Bit(1, 0);
    public bool CommandNotPermitted  => Bit(1, 1);

    // Octetul 2
    public bool PaperOut             => Bit(2, 0);
    public bool NearPaperEnd         => Bit(2, 1);
    public bool FiscalReceiptOpen    => Bit(2, 3);
    public bool NonFiscalReceiptOpen => Bit(2, 5);

    // Octetul 4
    public bool FiscalMemoryFull  => Bit(4, 4);

    /// <summary>Aparatul a respins comanda — știm sigur că NU a executat-o.</summary>
    public bool CommandFailed => GeneralError || SyntaxError || InvalidCommand || CommandNotPermitted || Overflow;

    public IReadOnlyList<string> Describe()
    {
        var list = new List<string>();
        if (SyntaxError) list.Add("Eroare de sintaxă în comandă.");
        if (InvalidCommand) list.Add("Comandă necunoscută aparatului.");
        if (CommandNotPermitted) list.Add("Comanda nu este permisă în starea curentă a aparatului.");
        if (Overflow) list.Add("Depășire (sumă sau câmp prea mare).");
        if (PrinterFailure) list.Add("Defect al mecanismului de tipărire.");
        if (CoverOpen) list.Add("Capacul imprimantei este deschis.");
        if (PaperOut) list.Add("Lipsă hârtie.");
        if (FiscalMemoryFull) list.Add("Memoria fiscală este plină.");
        if (ClockNotSet) list.Add("Ceasul aparatului nu este setat.");
        if (list.Count == 0 && GeneralError) list.Add("Eroare generală raportată de aparat.");
        return list;
    }

    public override string ToString() => Convert.ToHexString(_bytes);
}
