namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru nomenclatoare simple (lookup tables): Genders, BloodTypes, AllergyTypes, AllergySeverities.</summary>
public static class NomenclatureLookupProcedures
{
    public const string GetGenders           = "dbo.Nomenclature_GetGenders";
    public const string GetBloodTypes        = "dbo.Nomenclature_GetBloodTypes";
    public const string GetAllergyTypes      = "dbo.Nomenclature_GetAllergyTypes";
    public const string GetAllergySeverities = "dbo.Nomenclature_GetAllergySeverities";
}
