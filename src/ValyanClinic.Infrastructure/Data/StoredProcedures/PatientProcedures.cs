namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Patient. Convenție: dbo.[Entitate]_[Acțiune]</summary>
public static class PatientProcedures
{
    public const string GetById      = "dbo.Patient_GetById";
    public const string GetPaged     = "dbo.Patient_GetPaged";
    public const string Create       = "dbo.Patient_Create";
    public const string Update       = "dbo.Patient_Update";
    public const string Delete       = "dbo.Patient_Delete";
    public const string ExistsByCnp  = "dbo.Patient_ExistsByCnp";
}
