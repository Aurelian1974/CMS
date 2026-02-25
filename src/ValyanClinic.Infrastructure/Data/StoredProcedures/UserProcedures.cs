namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru autentificare și utilizatori.</summary>
public static class UserProcedures
{
    public const string GetById           = "dbo.User_GetById";
    public const string GetByEmail        = "dbo.User_GetByEmail";
    public const string GetPaged          = "dbo.User_GetPaged";
    public const string Create            = "dbo.User_Create";
    public const string Update            = "dbo.User_Update";
    public const string Delete            = "dbo.User_Delete";
    public const string UpdatePassword    = "dbo.User_UpdatePassword";
    public const string IncrementFailedLogin = "dbo.User_IncrementFailedLogin";
    public const string ResetFailedLogin  = "dbo.User_ResetFailedLogin";
}

/// <summary>Stored procedures pentru roluri (nomenclator).</summary>
public static class RoleProcedures
{
    public const string GetAll = "dbo.Role_GetAll";
}

/// <summary>Stored procedures pentru refresh token-uri.</summary>
public static class RefreshTokenProcedures
{
    public const string GetByToken = "dbo.RefreshToken_GetByToken";
    public const string Create     = "dbo.RefreshToken_Create";
    public const string Revoke     = "dbo.RefreshToken_Revoke";
    public const string RevokeAll  = "dbo.RefreshToken_RevokeAll";
}
