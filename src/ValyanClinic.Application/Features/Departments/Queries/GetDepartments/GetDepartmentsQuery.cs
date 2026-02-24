using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Departments.DTOs;

namespace ValyanClinic.Application.Features.Departments.Queries.GetDepartments;

/// <summary>Listare departamente per clinică cu filtre opționale.</summary>
public sealed record GetDepartmentsQuery(
    bool? IsActive = null,
    Guid? LocationId = null
) : IRequest<Result<IEnumerable<DepartmentDto>>>;
