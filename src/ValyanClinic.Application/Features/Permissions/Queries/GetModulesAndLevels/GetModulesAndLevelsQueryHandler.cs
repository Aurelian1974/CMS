using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetModulesAndLevels;

public sealed class GetModulesAndLevelsQueryHandler(
    IPermissionRepository permissionRepository)
    : IRequestHandler<GetModulesAndLevelsQuery, Result<ModulesAndLevelsDto>>
{
    public async Task<Result<ModulesAndLevelsDto>> Handle(
        GetModulesAndLevelsQuery request, CancellationToken ct)
    {
        var modules = await permissionRepository.GetAllModulesAsync(ct);
        var accessLevels = await permissionRepository.GetAllAccessLevelsAsync(ct);

        var dto = new ModulesAndLevelsDto
        {
            Modules = modules,
            AccessLevels = accessLevels
        };

        return Result<ModulesAndLevelsDto>.Success(dto);
    }
}
