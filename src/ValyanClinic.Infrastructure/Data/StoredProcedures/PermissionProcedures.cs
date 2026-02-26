namespace ValyanClinic.Infrastructure.Data.StoredProcedures;

/// <summary>Stored procedures pentru sistemul de permisiuni RBAC.</summary>
public static class PermissionProcedures
{
    public const string GetEffectiveByUser    = "dbo.Permission_GetEffectiveByUser";
    public const string GetRolePermissions    = "dbo.Permission_GetRolePermissions";
    public const string GetUserOverrides      = "dbo.Permission_GetUserOverrides";
    public const string SyncRolePermissions   = "dbo.Permission_SyncRolePermissions";
    public const string SyncUserOverrides     = "dbo.Permission_SyncUserOverrides";
    public const string GetAllModules         = "dbo.Permission_GetAllModules";
    public const string GetAllAccessLevels    = "dbo.Permission_GetAllAccessLevels";
}
