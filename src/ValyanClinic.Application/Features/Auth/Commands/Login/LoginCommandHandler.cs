using MediatR;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Common.Configuration;

namespace ValyanClinic.Application.Features.Auth.Commands.Login;

/// <summary>
/// Handler pentru login — verifică credențialele, gestionează lockout,
/// generează access + refresh token.
/// </summary>
public sealed class LoginCommandHandler(
    IAuthRepository authRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IPermissionRepository permissionRepository,
    IOptions<JwtOptions> jwtOptions,
    IOptions<RateLimitingOptions> rateLimitingOptions)
    : IRequestHandler<LoginCommand, Result<LoginResponseDto>>
{
    public async Task<Result<LoginResponseDto>> Handle(
        LoginCommand request, CancellationToken ct)
    {
        // 1. Căutare utilizator după email sau username (fără filtru clinic)
        var user = await authRepository.GetByEmailOrUsernameAsync(request.Email, ct);

        if (user is null)
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidCredentials);

        // 2. Verificare cont activ
        if (!user.IsActive)
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.AccountInactive);

        // 3. Verificare lockout
        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.Now)
        {
            var minutesLeft = (int)Math.Ceiling((user.LockoutEnd.Value - DateTime.Now).TotalMinutes);
            return Result<LoginResponseDto>.Unauthorized(
                string.Format(ErrorMessages.Auth.AccountLocked, minutesLeft));
        }

        // 4. Verificare parolă
        if (!passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            // Incrementare login eșuat (lockout automat dacă se depășește limita)
            var rl = rateLimitingOptions.Value;
            await authRepository.IncrementFailedLoginAsync(
                user.Id, rl.LoginMaxAttempts, rl.LoginWindowMinutes, ct);

            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidCredentials);
        }

        // 5. Login reușit — reset failed attempts
        await authRepository.ResetFailedLoginAsync(user.Id, ct);

        // 6. Generare access token (include roleId claim)
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        var accessToken = tokenService.GenerateAccessToken(
            user.Id, user.ClinicId, user.Email, fullName, user.RoleCode, user.RoleId);

        // 7. Generare refresh token + salvare în DB
        var refreshToken = tokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.UtcNow.AddDays(jwtOptions.Value.RefreshTokenExpiryDays);
        await authRepository.CreateRefreshTokenAsync(
            user.Id, refreshToken, refreshExpiry, null, ct);

        // 8. Încărcare permisiuni efective (rol + override-uri)
        var effectivePermissions = await permissionRepository.GetEffectiveByUserAsync(
            user.Id, user.RoleId, ct);

        var permissions = effectivePermissions
            .Select(p => new ModulePermissionDto
            {
                Module = p.ModuleCode,
                Level = p.AccessLevel,
                IsOverridden = p.IsOverridden
            })
            .ToList();

        // 9. Returnare răspuns
        var response = new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new AuthUserDto
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                FullName = fullName,
                Role = user.RoleCode,
                RoleId = user.RoleId.ToString(),
                ClinicId = user.ClinicId.ToString(),
            },
            Permissions = permissions
        };

        return Result<LoginResponseDto>.Success(response);
    }
}
