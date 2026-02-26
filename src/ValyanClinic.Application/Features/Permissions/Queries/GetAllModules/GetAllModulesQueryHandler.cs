using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetAllModules;

public sealed class GetAllModulesQueryHandler(
    IPermissionRepository permissionRepository)
    : IRequestHandler<GetAllModulesQuery, Result<IReadOnlyList<ModuleDto>>>
{
    public async Task<Result<IReadOnlyList<ModuleDto>>> Handle(
        GetAllModulesQuery request, CancellationToken ct)
    {
        var modules = await permissionRepository.GetAllModulesAsync(ct);
        return Result<IReadOnlyList<ModuleDto>>.Success(modules);
    }
}
