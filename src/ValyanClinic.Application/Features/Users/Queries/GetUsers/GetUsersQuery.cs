using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;

namespace ValyanClinic.Application.Features.Users.Queries.GetUsers;

/// <summary>Listare paginată utilizatori cu căutare și filtre.</summary>
public sealed record GetUsersQuery(
    string? Search = null,
    Guid? RoleId = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "lastName",
    string SortDir = "asc"
) : IRequest<Result<PagedResult<UserListDto>>>;
