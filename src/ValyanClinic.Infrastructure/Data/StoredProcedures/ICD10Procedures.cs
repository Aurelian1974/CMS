namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru coduri ICD-10: căutare, favorite.</summary>
public static class ICD10Procedures
{
    public const string Search         = "dbo.sp_ICD10_Search";
    public const string GetByCode      = "dbo.sp_ICD10_GetByCode";
    public const string GetCommonCodes = "dbo.sp_ICD10_GetCommonCodes";
    public const string GetFavorites   = "dbo.sp_ICD10_GetFavorites";
    public const string AddFavorite    = "dbo.sp_ICD10_AddFavorite";
    public const string RemoveFavorite = "dbo.sp_ICD10_RemoveFavorite";
}
