namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea MedicalStaff.</summary>
public static class MedicalStaffProcedures
{
    public const string GetById    = "dbo.MedicalStaff_GetById";
    public const string GetPaged   = "dbo.MedicalStaff_GetPaged";
    public const string GetByClinic = "dbo.MedicalStaff_GetByClinic";
    public const string Create     = "dbo.MedicalStaff_Create";
    public const string Update     = "dbo.MedicalStaff_Update";
    public const string Delete     = "dbo.MedicalStaff_Delete";
}
