using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Common.Configuration;

namespace ValyanClinic.Application.Features.Auth.Commands.Login;

/// <summary>
/// Handler pentru login — verifică credențialele, gestionează lockout,
/// generează access + refresh token și pre-populează cache-ul de permisiuni.
/// </summary>
public sealed class LoginCommandHandler(
    IAuthRepository authRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IPermissionRepository permissionRepository,
    ISecuritySettingsProvider settingsProvider,
    ISecurityEventLogger securityLog,
    IMemoryCache cache)
    : IRequestHandler<LoginCommand, Result<LoginResponseDto>>
{
    /// <summary>
    /// Hash folosit ca momeala cand utilizatorul nu exista. Fara el, ramura
    /// „user inexistent" raspunde imediat, in timp ce una cu user existent plateste
    /// costul BCrypt (~250 ms la work factor 12): diferenta e banal de masurat si
    /// spune atacatorului care adrese sunt inregistrate.
    ///
    /// Se calculeaza o singura data, prin hasher-ul injectat, ca sa aiba exact acelasi
    /// work factor ca hash-urile reale — un hash fix in cod ar putea diverge de
    /// configuratie si ar reintroduce diferenta de timp pe care o eliminam.
    /// Cursa la initializare e inofensiva: ambele fire produc un hash la fel de valabil.
    /// </summary>
    private static string? _dummyPasswordHash;

    public async Task<Result<LoginResponseDto>> Handle(
        LoginCommand request, CancellationToken ct)
    {
        // Setarile sunt administrabile din aplicatie; provider-ul le cachuieste
        // si garanteaza pragurile minime, deci le citim o data si le folosim direct.
        var settings = await settingsProvider.GetAsync(ct);

        // 1. Căutare utilizator după email sau username (fără filtru clinic)
        var user = await authRepository.GetByEmailOrUsernameAsync(request.Email, ct);

        if (user is null)
        {
            // Consumam acelasi timp ca o verificare reala, apoi raspundem identic.
            _dummyPasswordHash ??= passwordHasher.HashPassword(Guid.NewGuid().ToString());
            passwordHasher.VerifyPassword(request.Password, _dummyPasswordHash);

            await securityLog.LogAsync(
                SecurityEventTypes.LoginFailed, succeeded: false,
                emailAttempted: request.Email, details: "Utilizator inexistent.", ct: ct);

            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidCredentials);
        }

        // 2. Verificare cont activ
        if (!user.IsActive)
        {
            await securityLog.LogAsync(
                SecurityEventTypes.AccountInactive, succeeded: false,
                userId: user.Id, clinicId: user.ClinicId, emailAttempted: request.Email, ct: ct);

            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.AccountInactive);
        }

        // 3. Verificare lockout
        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.Now)
        {
            var minutesLeft = (int)Math.Ceiling((user.LockoutEnd.Value - DateTime.Now).TotalMinutes);

            await securityLog.LogAsync(
                SecurityEventTypes.AccountLocked, succeeded: false,
                userId: user.Id, clinicId: user.ClinicId, emailAttempted: request.Email,
                details: $"Blocat inca {minutesLeft} minute.", ct: ct);

            return Result<LoginResponseDto>.Unauthorized(
                string.Format(ErrorMessages.Auth.AccountLocked, minutesLeft));
        }

        // 4. Verificare parolă
        if (!passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            // Incrementare login eșuat (lockout automat dacă se depășește limita).
            // Pragul și durata vin din setarile de securitate — nu din RateLimiting,
            // care guvernează limitarea cererilor per IP, nu blocarea unui cont.
            await authRepository.IncrementFailedLoginAsync(
                user.Id, settings.MaxFailedLoginAttempts, settings.LockoutMinutes, ct);

            await securityLog.LogAsync(
                SecurityEventTypes.LoginFailed, succeeded: false,
                userId: user.Id, clinicId: user.ClinicId, emailAttempted: request.Email,
                details: "Parola incorecta.", ct: ct);

            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidCredentials);
        }

        // 5. Login reușit — reset failed attempts
        await authRepository.ResetFailedLoginAsync(user.Id, ct);

        await securityLog.LogAsync(
            SecurityEventTypes.LoginSucceeded, succeeded: true,
            userId: user.Id, clinicId: user.ClinicId, emailAttempted: request.Email, ct: ct);

        // 6. Generare access token (include roleId claim)
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        var accessToken = tokenService.GenerateAccessToken(
            user.Id, user.ClinicId, user.Email, fullName, user.RoleCode, user.RoleId);

        // 7. Generare refresh token + salvare în DB.
        //    Durata e configurabila per rol; toate rolurile pornesc de la 7 zile,
        //    valoarea globala de dinainte.
        var roleSettings = await settingsProvider.GetForRoleAsync(user.RoleId, ct);
        var refreshToken = tokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.Now.AddDays(roleSettings.RefreshTokenDays);
        await authRepository.CreateRefreshTokenAsync(
            user.Id, refreshToken, refreshExpiry, null, ct);

        // 8. Încărcare permisiuni efective (rol + override-uri)
        var effectivePermissions = await permissionRepository.GetEffectiveByUserAsync(
            user.Id, user.RoleId, ct);

        // Pre-populăm cache-ul de autorizare (Dictionary<string,int>) și cache-ul de DTO-uri,
        // astfel primul request API după login nu mai necesită un DB call suplimentar.
        var cacheVersion = cache.Get<long>(PermissionCacheKeys.Version);
        cache.Set(
            PermissionCacheKeys.ForUser(user.Id, cacheVersion),
            effectivePermissions.ToDictionary(p => p.ModuleCode, p => p.AccessLevel),
            PermissionCacheKeys.Ttl);
        cache.Set(
            PermissionCacheKeys.DtoForUser(user.Id, cacheVersion),
            effectivePermissions,
            PermissionCacheKeys.Ttl);

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
            RefreshTokenExpiresAt = refreshExpiry,
            User = new AuthUserDto
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                FullName = fullName,
                Role = user.RoleCode,
                RoleId = user.RoleId.ToString(),
                ClinicId = user.ClinicId.ToString(),
                DoctorId = user.DoctorId?.ToString(),
                MustChangePassword = user.MustChangePassword,
            },
            Permissions = permissions
        };

        return Result<LoginResponseDto>.Success(response);
    }
}
