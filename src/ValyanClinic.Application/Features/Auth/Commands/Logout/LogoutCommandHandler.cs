using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Auth.Commands.Logout;

/// <summary>
/// Handler pentru logout — revocă refresh token-ul din cookie.
/// </summary>
public sealed class LogoutCommandHandler(IAuthRepository authRepository)
    : IRequestHandler<LogoutCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(LogoutCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return Result<bool>.Success(true);

        await authRepository.RevokeRefreshTokenAsync(request.RefreshToken, null, ct);
        return Result<bool>.Success(true);
    }
}
