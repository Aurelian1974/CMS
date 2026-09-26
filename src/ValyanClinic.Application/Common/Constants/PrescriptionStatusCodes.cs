namespace ValyanClinic.Application.Common.Constants;

/// <summary>Codurile statusurilor de rețetă (seed în migrarea 0051_CreatePrescriptions.sql).</summary>
public static class PrescriptionStatusCodes
{
    public const string Draft       = "CIORNA";
    public const string Issued      = "EMISA";
    public const string Transmitted = "TRANSMISA";
    public const string Dispensed   = "ELIBERATA";
    public const string Cancelled   = "ANULATA";
}
