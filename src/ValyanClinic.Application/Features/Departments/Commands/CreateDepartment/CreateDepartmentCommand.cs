using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Departments.Commands.CreateDepartment;

/// <summary>Creare departament nou pentru clinica curentă.</summary>
public sealed record CreateDepartmentCommand(
    Guid LocationId,
    string Name,
    string Code,
    string? Description,
    Guid? HeadDoctorId
) : IRequest<Result<Guid>>;
