namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru preferințele sidebar-ului per utilizator.</summary>
public static class UserMenuPreferenceProcedures
{
    public const string GetByUser = "dbo.UserMenuPreference_GetByUser";
    public const string Upsert    = "dbo.UserMenuPreference_Upsert";
}
