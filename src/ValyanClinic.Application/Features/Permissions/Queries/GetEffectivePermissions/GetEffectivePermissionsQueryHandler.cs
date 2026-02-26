using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetEffectivePermissions;

public sealed class GetEffectivePermissionsQueryHandler(
    IPermissionRepository permissionRepository)
    : IRequestHandler<GetEffectivePermissionsQuery, Result<IReadOnlyList<UserModulePermissionDto>>>
{
    public async Task<Result<IReadOnlyList<UserModulePermissionDto>>> Handle(
        GetEffectivePermissionsQuery request, CancellationToken ct)
    {
        var permissions = await permissionRepository.GetEffectiveByUserAsync(
            request.UserId, request.RoleId, ct);
        return Result<IReadOnlyList<UserModulePermissionDto>>.Success(permissions);
    }
}
