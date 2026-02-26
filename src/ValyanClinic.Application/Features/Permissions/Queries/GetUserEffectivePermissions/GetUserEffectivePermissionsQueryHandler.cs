using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetUserEffectivePermissions;

public sealed class GetUserEffectivePermissionsQueryHandler(
    IPermissionRepository permissionRepository)
    : IRequestHandler<GetUserEffectivePermissionsQuery, Result<IReadOnlyList<UserModulePermissionDto>>>
{
    public async Task<Result<IReadOnlyList<UserModulePermissionDto>>> Handle(
        GetUserEffectivePermissionsQuery request, CancellationToken ct)
    {
        var permissions = await permissionRepository.GetEffectiveByUserAsync(
            request.UserId, request.RoleId, ct);

        return Result<IReadOnlyList<UserModulePermissionDto>>.Success(permissions);
    }
}
