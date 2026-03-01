namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru date geografice: județe și localități.</summary>
public static class GeographyProcedures
{
    public const string GetCounties   = "dbo.Geography_GetCounties";
    public const string GetLocalities = "dbo.Geography_GetLocalities";
}
