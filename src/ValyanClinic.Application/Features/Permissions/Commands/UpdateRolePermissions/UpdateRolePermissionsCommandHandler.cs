using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Commands.UpdateRolePermissions;

public sealed class UpdateRolePermissionsCommandHandler(
    IPermissionRepository permissionRepository,
    ICurrentUser currentUser,
    IMemoryCache memoryCache)
    : IRequestHandler<UpdateRolePermissionsCommand, Result<int>>
{
    /// <summary>
    /// Versiune globală incrementată la fiecare modificare de permisiuni pe rol.
    /// Authorization handler-ul verifică această versiune și reîncarcă cache-ul dacă e diferită.
    /// </summary>
    // Păstrat public pentru compatibilitate cu teste existente
    public static readonly string CacheVersionKey = PermissionCacheKeys.Version;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task<Result<int>> Handle(
        UpdateRolePermissionsCommand request, CancellationToken ct)
    {
        // Serializare JSON pentru SP (parametru TVP-like via JSON).
        // SP folosește JSON_VALUE cu chei camelCase, deci forțăm policy-ul corespunzător.
        var json = JsonSerializer.Serialize(
            request.Permissions.Select(p => new
            {
                ModuleId = p.ModuleId,
                AccessLevelId = p.AccessLevelId,
            }),
            JsonOptions);

        var affectedRows = await permissionRepository.SyncRolePermissionsAsync(
            request.RoleId, json, currentUser.Id, ct);

        // Incrementare versiune cache — forțează reload la următorul request
        var currentVersion = memoryCache.Get<long>(CacheVersionKey);
        memoryCache.Set(CacheVersionKey, currentVersion + 1);

        return Result<int>.Success(affectedRows);
    }
}
