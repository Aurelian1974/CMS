namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Clinic (societate comercială).</summary>
public static class ClinicProcedures
{
    public const string GetById = "dbo.Clinic_GetById";
    public const string GetAll  = "dbo.Clinic_GetAll";
    public const string Create  = "dbo.Clinic_Create";
    public const string Update  = "dbo.Clinic_Update";
}
