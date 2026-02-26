using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Interfaces;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>
/// ASP.NET Core authorization handler care verifică permisiunile efective ale utilizatorului.
/// Permisiunile sunt cachuite 5 minute per utilizator pentru performanță.
/// </summary>
public sealed class ModuleAccessAuthorizationHandler(
    IPermissionRepository permissionRepository,
    IMemoryCache cache)
    : AuthorizationHandler<ModuleAccessRequirement>
{
    private const int CacheMinutes = 5;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ModuleAccessRequirement requirement)
    {
        // Extrage userId și roleId din claims
        var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var roleIdClaim = context.User.FindFirst("roleId")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(roleIdClaim))
            return; // Fail — nu are claims necesare

        var userId = Guid.Parse(userIdClaim);
        var roleId = Guid.Parse(roleIdClaim);

        // Caută permisiunile în cache sau le încarcă din DB
        // Cache-ul e invalidat la modificarea permisiunilor (prin cache version key)
        var cacheVersionKey = "permissions:version";
        var currentVersion = cache.Get<long>(cacheVersionKey);
        var cacheKey = $"permissions:{userId}:v{currentVersion}";

        if (!cache.TryGetValue(cacheKey, out Dictionary<string, int>? permissions))
        {
            var effectivePermissions = await permissionRepository.GetEffectiveByUserAsync(
                userId, roleId, CancellationToken.None);

            permissions = effectivePermissions.ToDictionary(
                p => p.ModuleCode,
                p => p.AccessLevel);

            cache.Set(cacheKey, permissions, TimeSpan.FromMinutes(CacheMinutes));
        }

        // Verificare: nivelul efectiv >= nivelul minim cerut
        if (permissions!.TryGetValue(requirement.Module, out var userLevel)
            && userLevel >= (int)requirement.MinimumLevel)
        {
            context.Succeed(requirement);
        }
    }
}
