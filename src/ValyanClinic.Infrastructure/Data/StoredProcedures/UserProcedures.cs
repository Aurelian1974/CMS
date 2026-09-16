namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru autentificare și utilizatori.</summary>
public static class UserProcedures
{
    public const string GetById              = "dbo.User_GetById";
    public const string GetByEmail           = "dbo.User_GetByEmail";
    public const string GetByIdForAuth       = "dbo.User_GetByIdForAuth";
    public const string GetPaged             = "dbo.User_GetPaged";
    public const string Create               = "dbo.User_Create";
    public const string Update               = "dbo.User_Update";
    public const string Delete               = "dbo.User_Delete";
    public const string UpdatePassword       = "dbo.User_UpdatePassword";
    public const string IncrementFailedLogin = "dbo.User_IncrementFailedLogin";
    public const string ResetFailedLogin     = "dbo.User_ResetFailedLogin";
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
    public const string Rotate     = "dbo.RefreshToken_Rotate";
    public const string DeleteExpired = "dbo.RefreshToken_DeleteExpired";
}

/// <summary>Nume SP pentru jurnalul de evenimente de securitate.</summary>
public static class SecurityEventProcedures
{
    public const string Create    = "dbo.SecurityEvent_Create";
    public const string DeleteOld = "dbo.SecurityEvent_DeleteOld";
    public const string GetPaged  = "dbo.SecurityEvent_GetPaged";
}

/// <summary>Nume SP pentru setarile de securitate administrabile.</summary>
public static class SecuritySettingsProcedures
{
    public const string Get         = "dbo.SecuritySettings_Get";
    public const string Update      = "dbo.SecuritySettings_Update";
    public const string GetAllRoles = "dbo.RoleSecuritySettings_GetAll";
    public const string UpdateRole  = "dbo.RoleSecuritySettings_Update";
}

/// <summary>Nume SP pentru istoricul parolelor.</summary>
public static class PasswordHistoryProcedures
{
    public const string Add       = "dbo.PasswordHistory_Add";
    public const string GetRecent = "dbo.PasswordHistory_GetRecent";
}
