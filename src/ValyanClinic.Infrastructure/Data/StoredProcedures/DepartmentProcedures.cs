namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Department (departamente / secții).</summary>
public static class DepartmentProcedures
{
    public const string GetByClinic = "dbo.Department_GetByClinic";
    public const string GetById     = "dbo.Department_GetById";
    public const string Create      = "dbo.Department_Create";
    public const string Update      = "dbo.Department_Update";
    public const string Delete      = "dbo.Department_Delete";
}
