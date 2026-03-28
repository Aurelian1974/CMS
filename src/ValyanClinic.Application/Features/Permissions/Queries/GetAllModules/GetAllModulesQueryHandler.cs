using MediatR;
using Microsoft.Extensions.Caching.Memory;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetAllModules;

public sealed class GetAllModulesQueryHandler(
    IPermissionRepository permissionRepository,
    IMemoryCache cache)
    : IRequestHandler<GetAllModulesQuery, Result<IReadOnlyList<ModuleDto>>>
{
    private const string CacheKey = "modules:all";

    public async Task<Result<IReadOnlyList<ModuleDto>>> Handle(
        GetAllModulesQuery request, CancellationToken ct)
    {
        if (cache.TryGetValue(CacheKey, out IReadOnlyList<ModuleDto>? cached) && cached is not null)
            return Result<IReadOnlyList<ModuleDto>>.Success(cached);

        var modules = await permissionRepository.GetAllModulesAsync(ct);

        // Lista de module este statică (se schimbă doar la deploy) — cache fără expirare
        cache.Set(CacheKey, modules, new MemoryCacheEntryOptions { Priority = CacheItemPriority.NeverRemove });

        return Result<IReadOnlyList<ModuleDto>>.Success(modules);
    }
}
