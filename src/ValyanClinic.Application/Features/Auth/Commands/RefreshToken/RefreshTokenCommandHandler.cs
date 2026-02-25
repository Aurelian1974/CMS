using MediatR;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Auth.Commands.Login;
using ValyanClinic.Application.Common.Configuration;

namespace ValyanClinic.Application.Features.Auth.Commands.RefreshToken;

/// <summary>
/// Handler pentru refresh token — validează token-ul vechi, generează pereche nouă (rotație).
/// </summary>
public sealed class RefreshTokenCommandHandler(
    IAuthRepository authRepository,
    ITokenService tokenService,
    IOptions<JwtOptions> jwtOptions)
    : IRequestHandler<RefreshTokenCommand, Result<LoginResponseDto>>
{
    public async Task<Result<LoginResponseDto>> Handle(
        RefreshTokenCommand request, CancellationToken ct)
    {
        // 1. Căutare refresh token în DB
        var existingToken = await authRepository.GetRefreshTokenAsync(request.Token, ct);

        if (existingToken is null || !existingToken.IsActive)
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidToken);

        // 2. Obținem datele utilizatorului (folosim email/username search dar cu userId)
        // Revocăm token-ul vechi și generăm unul nou
        var newRefreshToken = tokenService.GenerateRefreshToken();

        await authRepository.RevokeRefreshTokenAsync(
            request.Token, newRefreshToken, ct);

        // 3. Salvăm noul refresh token
        var refreshExpiry = DateTime.UtcNow.AddDays(jwtOptions.Value.RefreshTokenExpiryDays);
        await authRepository.CreateRefreshTokenAsync(
            existingToken.UserId, newRefreshToken, refreshExpiry, request.IpAddress, ct);

        // 4. Obținem datele utilizatorului pentru noul access token
        // Căutăm direct în users — avem UserId din refresh token
        var user = await authRepository.GetUserByIdForTokenAsync(existingToken.UserId, ct);

        if (user is null || !user.IsActive)
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.AccountInactive);

        // 5. Generare access token
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        var accessToken = tokenService.GenerateAccessToken(
            user.Id, user.ClinicId, user.Email, fullName, user.RoleCode);

        var response = new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            User = new AuthUserDto
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                FullName = fullName,
                Role = user.RoleCode,
                ClinicId = user.ClinicId.ToString(),
            }
        };

        return Result<LoginResponseDto>.Success(response);
    }
}
