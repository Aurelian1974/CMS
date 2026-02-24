using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Departments.Commands.DeleteDepartment;

/// <summary>Soft delete departament.</summary>
public sealed record DeleteDepartmentCommand(Guid Id) : IRequest<Result<bool>>;
