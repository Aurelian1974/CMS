namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>
/// Codurile comenzilor folosite. Toate sunt din documentația protocolului Datecs clasic și
/// trebuie confirmate pe modelul / firmware-ul exact din cabinet.
/// </summary>
internal static class DatecsCommands
{
    // NEVERIFICAT PE APARAT — 48: deschidere bon fiscal „<OpCode>,<OpPwd>,<TillNmb>"
    public const byte OpenFiscalReceipt = 0x30;

    // NEVERIFICAT PE APARAT — 49: vânzare „<Text><Tab><TaxGr><Price>*<Qty>"
    public const byte RegisterSale = 0x31;

    // NEVERIFICAT PE APARAT — 53: subtotal + plată „<Tab><PaidMode><Amount>"
    public const byte Total = 0x35;

    // NEVERIFICAT PE APARAT — 56: închidere bon fiscal → „<AllReceipt>,<FiscReceipt>"
    public const byte CloseFiscalReceipt = 0x38;

    // NEVERIFICAT PE APARAT — 60: anulare bon fiscal deschis
    public const byte CancelFiscalReceipt = 0x3C;

    // NEVERIFICAT PE APARAT — 74: citire octeți de status
    public const byte Status = 0x4A;

    // NEVERIFICAT PE APARAT — 76: starea tranzacției fiscale „<Open>,<Items>,<Amount>[,<Tender>]"
    public const byte FiscalTransactionStatus = 0x4C;

    // NEVERIFICAT PE APARAT — 90: informații diagnostic „<Name>,<FwRev>…,<Chk>,<Sw>,<Ser>,<FM>"
    public const byte DiagnosticInfo = 0x5A;
}
