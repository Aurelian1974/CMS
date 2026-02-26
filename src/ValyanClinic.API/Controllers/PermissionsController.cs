using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Features.Permissions.Commands.UpdateRolePermissions;
using ValyanClinic.Application.Features.Permissions.Commands.UpdateUserOverrides;
using ValyanClinic.Application.Features.Permissions.Queries.GetModulesAndLevels;
using ValyanClinic.Application.Features.Permissions.Queries.GetRolePermissions;
using ValyanClinic.Application.Features.Permissions.Queries.GetUserEffectivePermissions;
using ValyanClinic.Application.Features.Permissions.Queries.GetUserOverrides;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru gestionarea permisiunilor RBAC — acces exclusiv admin.
/// </summary>
public class PermissionsController : BaseApiController
{
    /// <summary>Returnează modulele și nivelurile de acces disponibile (pentru dropdowns UI).</summary>
    [HttpGet("modules-and-levels")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetModulesAndLevels(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetModulesAndLevelsQuery(), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează permisiunile default ale unui rol.</summary>
    [HttpGet("roles/{roleId:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetRolePermissions(Guid roleId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRolePermissionsQuery(roleId), ct);
        return HandleResult(result);
    }

    /// <summary>Actualizează permisiunile default ale unui rol (replace all).</summary>
    [HttpPut("roles/{roleId:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Full)]
    public async Task<IActionResult> UpdateRolePermissions(
        Guid roleId,
        [FromBody] UpdateRolePermissionsRequest request,
        CancellationToken ct)
    {
        var command = new UpdateRolePermissionsCommand(roleId, request.Permissions);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Returnează override-urile de permisiuni ale unui utilizator.</summary>
    [HttpGet("users/{userId:guid}/overrides")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetUserOverrides(Guid userId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetUserOverridesQuery(userId), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează permisiunile efective ale unui utilizator (rol + override-uri).</summary>
    [HttpGet("users/{userId:guid}/effective")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetUserEffectivePermissions(
        Guid userId, Guid roleId, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetUserEffectivePermissionsQuery(userId, roleId), ct);
        return HandleResult(result);
    }

    /// <summary>Actualizează override-urile de permisiuni ale unui utilizator (replace all).</summary>
    [HttpPut("users/{userId:guid}/overrides")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Full)]
    public async Task<IActionResult> UpdateUserOverrides(
        Guid userId,
        [FromBody] UpdateUserOverridesRequest request,
        CancellationToken ct)
    {
        var command = new UpdateUserOverridesCommand(userId, request.Overrides);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }
}

// ===== Request models pentru API =====

public sealed record UpdateRolePermissionsRequest(
    IReadOnlyList<RolePermissionItemDto> Permissions);

public sealed record UpdateUserOverridesRequest(
    IReadOnlyList<UserOverrideItemDto> Overrides);
