using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.ChangePassword;

/// <summary>Schimbare parolă utilizator — parola nouă va fi hash-uită cu BCrypt.</summary>
public sealed record ChangePasswordCommand(
    Guid UserId,
    string NewPassword
) : IRequest<Result<bool>>;
