using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Auth.Commands.Login;

/// <summary>
/// Comandă de login — acceptă email sau username + parolă.
/// </summary>
public sealed record LoginCommand(
    string Email,
    string Password
) : IRequest<Result<LoginResponseDto>>;
