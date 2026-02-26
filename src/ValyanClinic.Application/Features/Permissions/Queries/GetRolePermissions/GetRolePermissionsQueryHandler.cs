using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetRolePermissions;

public sealed class GetRolePermissionsQueryHandler(
    IPermissionRepository permissionRepository)
    : IRequestHandler<GetRolePermissionsQuery, Result<IReadOnlyList<RoleModulePermissionDto>>>
{
    public async Task<Result<IReadOnlyList<RoleModulePermissionDto>>> Handle(
        GetRolePermissionsQuery request, CancellationToken ct)
    {
        var permissions = await permissionRepository.GetRolePermissionsAsync(request.RoleId, ct);
        return Result<IReadOnlyList<RoleModulePermissionDto>>.Success(permissions);
    }
}
