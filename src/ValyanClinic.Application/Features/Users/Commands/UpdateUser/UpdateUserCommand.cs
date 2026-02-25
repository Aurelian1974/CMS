using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.UpdateUser;

/// <summary>Actualizare utilizator existent (fără parolă — parola e command separat).</summary>
public sealed record UpdateUserCommand(
    Guid Id,
    Guid RoleId,
    Guid? DoctorId,
    Guid? MedicalStaffId,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    bool IsActive
) : IRequest<Result<bool>>;
