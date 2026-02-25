using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.MedicalStaff.DTOs;

namespace ValyanClinic.Application.Features.MedicalStaff.Queries.GetMedicalStaffList;

/// <summary>Listare paginată personal medical cu căutare și filtre.</summary>
public sealed record GetMedicalStaffListQuery(
    string? Search = null,
    Guid? DepartmentId = null,
    Guid? MedicalTitleId = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "LastName",
    string SortDir = "asc"
) : IRequest<Result<PagedResult<MedicalStaffListDto>>>;
