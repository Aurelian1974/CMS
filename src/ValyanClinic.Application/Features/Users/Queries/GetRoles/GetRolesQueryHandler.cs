using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;

namespace ValyanClinic.Application.Features.Users.Queries.GetRoles;

public sealed class GetRolesQueryHandler(IUserRepository userRepository)
    : IRequestHandler<GetRolesQuery, Result<IReadOnlyList<RoleDto>>>
{
    public async Task<Result<IReadOnlyList<RoleDto>>> Handle(
        GetRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await userRepository.GetAllRolesAsync(cancellationToken);
        return Result<IReadOnlyList<RoleDto>>.Success(roles);
    }
}
