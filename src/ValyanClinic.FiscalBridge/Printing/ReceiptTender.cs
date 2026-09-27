namespace ValyanClinic.FiscalBridge.Printing;

/// <summary>Plată pe bon. <see cref="PaymentCode"/> = tipul de plată al aparatului (mapare din Setări financiare).</summary>
public sealed record ReceiptTender(string PaymentCode, decimal Amount);
