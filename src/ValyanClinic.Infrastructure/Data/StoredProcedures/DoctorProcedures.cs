namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Doctor.</summary>
public static class DoctorProcedures
{
    public const string GetById    = "dbo.Doctor_GetById";
    public const string GetPaged   = "dbo.Doctor_GetPaged";
    public const string GetByClinic = "dbo.Doctor_GetByClinic";
    public const string Create     = "dbo.Doctor_Create";
    public const string Update     = "dbo.Doctor_Update";
    public const string Delete     = "dbo.Doctor_Delete";
}
