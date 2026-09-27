namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

public static class FiscalReceiptProcedures
{
    public const string GetById      = "dbo.FiscalReceipt_GetById";
    public const string MarkPrinting = "dbo.FiscalReceipt_MarkPrinting";
    public const string SetResult    = "dbo.FiscalReceipt_SetResult";
    public const string Reconcile    = "dbo.FiscalReceipt_Reconcile";
}
