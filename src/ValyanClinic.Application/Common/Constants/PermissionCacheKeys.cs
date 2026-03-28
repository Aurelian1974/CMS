namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Chei și TTL pentru cache-ul de permisiuni — partajate între Application și Infrastructure
/// pentru a asigura coerența cheilor de cache.
/// </summary>
public static class PermissionCacheKeys
{
    /// <summary>Cheia versiunii globale de cache — incrementată la orice modificare de permisiuni.</summary>
    public const string Version = "permissions:version";

    /// <summary>TTL cache permisiuni — sincronizat cu <see cref="ModuleAccessAuthorizationHandler"/>.</summary>
    public static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Cheia cache pentru <c>Dictionary&lt;string, int&gt;</c> (moduleCode → accessLevel),
    /// folosită de <see cref="ModuleAccessAuthorizationHandler"/> la verificarea autorizării.
    /// </summary>
    public static string ForUser(Guid userId, long version)
        => $"permissions:{userId}:v{version}";

    /// <summary>
    /// Cheia cache pentru <c>IReadOnlyList&lt;UserModulePermissionDto&gt;</c>,
    /// folosită de login/refresh pentru a evita un DB call redundant la primul request.
    /// </summary>
    public static string DtoForUser(Guid userId, long version)
        => $"permissions:dto:{userId}:v{version}";
}
