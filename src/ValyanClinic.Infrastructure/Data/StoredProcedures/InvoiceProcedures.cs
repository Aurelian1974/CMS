namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru facturi. Facturile nu se modifică / șterg — doar storno.</summary>
public static class InvoiceProcedures
{
    public const string GetById       = "dbo.Invoice_GetById";
    public const string GetPaged      = "dbo.Invoice_GetPaged";
    public const string Create        = "dbo.Invoice_Create";
    public const string Storno        = "dbo.Invoice_Storno";
    public const string LineTableType = "dbo.InvoiceLineInputTableType";
}
