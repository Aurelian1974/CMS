using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Departments.DTOs;

namespace ValyanClinic.Application.Features.Departments.Queries.GetDepartmentById;

/// <summary>Obținere departament după Id.</summary>
public sealed record GetDepartmentByIdQuery(Guid Id) : IRequest<Result<DepartmentDto>>;
