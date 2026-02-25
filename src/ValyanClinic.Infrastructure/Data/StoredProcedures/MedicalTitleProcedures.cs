namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru entitatea MedicalTitle (nomenclator titulaturi medicale).</summary>
public static class MedicalTitleProcedures
{
    public const string GetAll       = "dbo.MedicalTitle_GetAll";
    public const string Create       = "dbo.MedicalTitle_Create";
    public const string Update       = "dbo.MedicalTitle_Update";
    public const string ToggleActive = "dbo.MedicalTitle_ToggleActive";
}
