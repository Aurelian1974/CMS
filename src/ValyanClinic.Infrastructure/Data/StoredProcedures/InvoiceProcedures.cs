namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Invoice.</summary>
public static class InvoiceProcedures
{
    public const string GetById      = "dbo.Invoice_GetById";
    public const string GetPaged     = "dbo.Invoice_GetPaged";
    public const string GetByPatient = "dbo.Invoice_GetByPatient";
    public const string Create       = "dbo.Invoice_Create";
    public const string Update       = "dbo.Invoice_Update";
    public const string UpdateStatus = "dbo.Invoice_UpdateStatus";
    public const string Delete       = "dbo.Invoice_Delete";
    public const string GetNextNumber = "dbo.Invoice_GetNextNumber";
}
