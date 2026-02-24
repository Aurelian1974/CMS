namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea Specialty (nomenclator specializări).</summary>
public static class SpecialtyProcedures
{
    public const string GetAll        = "dbo.Specialty_GetAll";
    public const string GetById       = "dbo.Specialty_GetById";
    public const string GetTree       = "dbo.Specialty_GetTree";
    public const string Create        = "dbo.Specialty_Create";
    public const string Update        = "dbo.Specialty_Update";
    public const string ToggleActive  = "dbo.Specialty_ToggleActive";
}
