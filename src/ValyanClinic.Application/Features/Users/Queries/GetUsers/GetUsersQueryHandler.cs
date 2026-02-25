using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;

namespace ValyanClinic.Application.Features.Users.Queries.GetUsers;

public sealed class GetUsersQueryHandler(
    IUserRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetUsersQuery, Result<PagedResult<UserListDto>>>
{
    public async Task<Result<PagedResult<UserListDto>>> Handle(
        GetUsersQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.Search,
            request.RoleId,
            request.IsActive,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortDir,
            cancellationToken);

        return Result<PagedResult<UserListDto>>.Success(result);
    }
}
