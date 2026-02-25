using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Doctors.DTOs;

namespace ValyanClinic.Application.Features.Doctors.Queries.GetDoctors;

/// <summary>Listare paginată doctori cu căutare și filtre.</summary>
public sealed record GetDoctorsQuery(
    string? Search = null,
    Guid? SpecialtyId = null,
    Guid? DepartmentId = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "LastName",
    string SortDir = "asc"
) : IRequest<Result<PagedResult<DoctorListDto>>>;
