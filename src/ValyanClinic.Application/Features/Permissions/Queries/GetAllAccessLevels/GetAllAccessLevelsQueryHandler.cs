using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetAllAccessLevels;

public sealed class GetAllAccessLevelsQueryHandler(
    IPermissionRepository permissionRepository)
    : IRequestHandler<GetAllAccessLevelsQuery, Result<IReadOnlyList<AccessLevelDto>>>
{
    public async Task<Result<IReadOnlyList<AccessLevelDto>>> Handle(
        GetAllAccessLevelsQuery request, CancellationToken ct)
    {
        var levels = await permissionRepository.GetAllAccessLevelsAsync(ct);
        return Result<IReadOnlyList<AccessLevelDto>>.Success(levels);
    }
}
