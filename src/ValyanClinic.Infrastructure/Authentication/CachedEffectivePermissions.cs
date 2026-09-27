using Microsoft.Extensions.Caching.Memory;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>
/// Citește cache-ul de permisiuni pre-populat la login/refresh (PermissionCacheKeys.ForUser);
/// la cache miss încarcă din BD și re-populează aceeași cheie.
/// </summary>
public sealed class CachedEffectivePermissions(
    IPermissionRepository permissionRepository,
    IMemoryCache cache) : IEffectivePermissions
{
    public async Task<IReadOnlyDictionary<string, int>> GetLevelsAsync(
        Guid userId, Guid roleId, CancellationToken ct)
    {
        var currentVersion = cache.Get<long>(PermissionCacheKeys.Version);
        var cacheKey = PermissionCacheKeys.ForUser(userId, currentVersion);

        if (cache.TryGetValue(cacheKey, out Dictionary<string, int>? permissions) && permissions is not null)
            return permissions;

        var effective = await permissionRepository.GetEffectiveByUserAsync(userId, roleId, ct);
        permissions = effective.ToDictionary(p => p.ModuleCode, p => p.AccessLevel);
        cache.Set(cacheKey, permissions, PermissionCacheKeys.Ttl);
        return permissions;
    }
}
