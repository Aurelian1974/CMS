using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativeStaffList;

/// <summary>Listare paginată personal administrativ cu căutare și filtre.</summary>
public sealed record GetAdministrativeStaffListQuery(
    string? Search = null,
    Guid? DepartmentId = null,
    Guid? PositionId = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "LastName",
    string SortDir = "asc"
) : IRequest<Result<PagedResult<AdministrativeStaffListDto>>>;
