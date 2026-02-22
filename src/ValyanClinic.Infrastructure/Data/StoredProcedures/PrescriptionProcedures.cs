namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Prescription.</summary>
public static class PrescriptionProcedures
{
    public const string GetById      = "dbo.Prescription_GetById";
    public const string GetPaged     = "dbo.Prescription_GetPaged";
    public const string GetByPatient = "dbo.Prescription_GetByPatient";
    public const string Create       = "dbo.Prescription_Create";
    public const string Delete       = "dbo.Prescription_Delete";
}
