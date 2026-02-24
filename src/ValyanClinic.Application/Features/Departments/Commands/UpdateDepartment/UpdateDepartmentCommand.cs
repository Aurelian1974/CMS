using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Departments.Commands.UpdateDepartment;

/// <summary>Actualizare departament existent.</summary>
public sealed record UpdateDepartmentCommand(
    Guid Id,
    Guid LocationId,
    string Name,
    string Code,
    string? Description,
    bool IsActive
) : IRequest<Result<bool>>;
