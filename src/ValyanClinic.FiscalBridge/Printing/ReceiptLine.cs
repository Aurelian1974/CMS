namespace ValyanClinic.FiscalBridge.Printing;

/// <summary>Articol pe bon. <see cref="TaxGroup"/> = grupa TVA programată în aparat (mapare din Setări financiare).</summary>
public sealed record ReceiptLine(string Name, decimal UnitPrice, decimal Quantity, string TaxGroup);
