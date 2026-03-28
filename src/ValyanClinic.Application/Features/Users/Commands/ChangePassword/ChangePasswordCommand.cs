using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.ChangePassword;

/// <summary>
/// Schimbare parolă utilizator — parola nouă va fi hash-uită cu BCrypt.
/// Dacă utilizatorul își schimbă propria parolă (UserId == currentUser.Id),
/// câmpul CurrentPassword este obligatoriu și va fi verificat împotriva hash-ului existent.
/// Administratorii pot reseta parola altor utilizatori fără CurrentPassword.
/// </summary>
public sealed record ChangePasswordCommand(
    Guid UserId,
    string NewPassword,
    string? CurrentPassword = null
) : IRequest<Result<bool>>;
