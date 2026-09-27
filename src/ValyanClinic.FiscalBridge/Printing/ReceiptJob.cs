namespace ValyanClinic.FiscalBridge.Printing;

/// <summary>
/// Un bon de tipărit. <see cref="JobId"/> = Id-ul FiscalReceipt din ValyanClinic — cheia de
/// idempotență: același job nu se tipărește de două ori.
/// </summary>
public sealed record ReceiptJob(Guid JobId, IReadOnlyList<ReceiptLine> Lines, IReadOnlyList<ReceiptTender> Tenders)
{
    public decimal Total => Lines.Sum(l => Math.Round(l.UnitPrice * l.Quantity, 2, MidpointRounding.AwayFromZero));
}
