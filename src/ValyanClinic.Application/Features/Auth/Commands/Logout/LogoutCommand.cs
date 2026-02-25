using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Auth.Commands.Logout;

/// <summary>
/// Comandă de logout — revocă refresh token-ul curent.
/// </summary>
public sealed record LogoutCommand(
    string? RefreshToken
) : IRequest<Result<bool>>;
