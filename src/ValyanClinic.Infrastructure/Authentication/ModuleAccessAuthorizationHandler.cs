using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using ValyanClinic.Application.Common.Interfaces;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>
/// ASP.NET Core authorization handler care verifică permisiunile efective ale utilizatorului.
/// Permisiunile vin din <see cref="IEffectivePermissions"/> — cache per utilizator și versiune
/// globală, pre-populat la login/refresh, partajat cu handler-ele de feature (ex. dashboard).
/// </summary>
public sealed class ModuleAccessAuthorizationHandler(IEffectivePermissions effectivePermissions)
    : AuthorizationHandler<ModuleAccessRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ModuleAccessRequirement requirement)
    {
        // Extrage userId și roleId din claims. TryParse tratează deopotrivă claim-ul
        // absent și pe cel malformat: un GUID invalid într-un token înseamnă refuz de
        // autorizare (401/403), nu o excepție netratată transformată în 500.
        if (!Guid.TryParse(context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId)
            || !Guid.TryParse(context.User.FindFirst("roleId")?.Value, out var roleId))
            return;

        var permissions = await effectivePermissions.GetLevelsAsync(userId, roleId, CancellationToken.None);

        // Verificare: nivelul efectiv >= nivelul minim cerut, pe oricare dintre modulele cerute
        if (requirement.Modules.Any(module =>
                permissions.TryGetValue(module, out var userLevel) && userLevel >= (int)requirement.MinimumLevel))
        {
            context.Succeed(requirement);
        }
    }
}
