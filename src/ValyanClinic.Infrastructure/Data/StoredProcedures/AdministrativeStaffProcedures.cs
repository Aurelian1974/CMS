namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea AdministrativeStaff și nomenclatorul de funcții.</summary>
public static class AdministrativeStaffProcedures
{
    public const string GetById      = "dbo.AdministrativeStaff_GetById";
    public const string GetPaged     = "dbo.AdministrativeStaff_GetPaged";
    public const string GetByClinic  = "dbo.AdministrativeStaff_GetByClinic";
    public const string Create       = "dbo.AdministrativeStaff_Create";
    public const string Update       = "dbo.AdministrativeStaff_Update";
    public const string Delete       = "dbo.AdministrativeStaff_Delete";
    public const string GetPositions = "dbo.AdministrativePosition_GetAll";
}
