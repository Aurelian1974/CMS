using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.CreateUser;

/// <summary>Creare utilizator nou — parola va fi hash-uită cu BCrypt.</summary>
public sealed record CreateUserCommand(
    Guid RoleId,
    Guid? DoctorId,
    Guid? MedicalStaffId,
    string Username,
    string Email,
    string Password,
    string FirstName,
    string LastName,
    bool IsActive = true
) : IRequest<Result<Guid>>;
