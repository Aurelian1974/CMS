using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetUserOverrides;

public sealed class GetUserOverridesQueryHandler(
    IPermissionRepository permissionRepository)
    : IRequestHandler<GetUserOverridesQuery, Result<IReadOnlyList<UserOverrideDto>>>
{
    public async Task<Result<IReadOnlyList<UserOverrideDto>>> Handle(
        GetUserOverridesQuery request, CancellationToken ct)
    {
        var overrides = await permissionRepository.GetUserOverridesAsync(request.UserId, ct);
        return Result<IReadOnlyList<UserOverrideDto>>.Success(overrides);
    }
}
