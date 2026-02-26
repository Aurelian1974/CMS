using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

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

        // Invalidare cache permisiuni pentru userul specificat
        var cacheKey = $"permissions:{request.UserId}";
        memoryCache.Remove(cacheKey);

        return Result<int>.Success(affectedRows);
    }
}
