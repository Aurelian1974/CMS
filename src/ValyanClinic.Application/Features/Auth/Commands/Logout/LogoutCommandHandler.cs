using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Auth.Commands.Logout;

/// <summary>
/// Handler pentru logout — revocă refresh token-ul din cookie.
/// </summary>
public sealed class LogoutCommandHandler(
    IAuthRepository authRepository,
    ICurrentUser currentUser,
    ISecurityEventLogger securityLog)
    : IRequestHandler<LogoutCommand, Result<bool>>
{
    /// <summary>Motivul trimis de client la deconectarea pentru inactivitate.</summary>
    private const string IdleReason = "idle";

    public async Task<Result<bool>> Handle(LogoutCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return Result<bool>.Success(true);

        await authRepository.RevokeRefreshTokenAsync(request.RefreshToken, null, ct);

        var expiredByIdle = string.Equals(request.Reason, IdleReason, StringComparison.OrdinalIgnoreCase);

        await securityLog.LogAsync(
            expiredByIdle ? SecurityEventTypes.SessionExpiredIdle : SecurityEventTypes.Logout,
            succeeded: !expiredByIdle,
            userId: currentUser.Id, clinicId: currentUser.ClinicId,
            details: expiredByIdle ? "Deconectare pentru inactivitate, initiata de client." : null,
            ct: ct);

        return Result<bool>.Success(true);
    }
}
