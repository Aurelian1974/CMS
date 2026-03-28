using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Permissions.Commands.UpdateRolePermissions;

namespace ValyanClinic.Application.Features.Permissions.Commands.UpdateUserOverrides;

public sealed class UpdateUserOverridesCommandHandler(
    IPermissionRepository permissionRepository,
    ICurrentUser currentUser,
    IMemoryCache memoryCache)
    : IRequestHandler<UpdateUserOverridesCommand, Result<int>>
{
    public async Task<Result<int>> Handle(
        UpdateUserOverridesCommand request, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(
            request.Overrides.Select(o => new
            {
                ModuleId = o.ModuleId,
                AccessLevelId = o.AccessLevelId
            }));

        var affectedRows = await permissionRepository.SyncUserOverridesAsync(
            request.UserId, json, currentUser.Id, ct);

        // Invalidare cache permisiuni — incrementăm versiunea globală pentru a forța
        // reload la toți utilizatorii afectați. Cheia reală din cache are formatul
        // "permissions:{userId}:v{version}", deci ștergerea cheii simple nu funcționează.
        var currentVersion = memoryCache.Get<long>(UpdateRolePermissionsCommandHandler.CacheVersionKey);
        memoryCache.Set(UpdateRolePermissionsCommandHandler.CacheVersionKey, currentVersion + 1);

        return Result<int>.Success(affectedRows);
    }
}
