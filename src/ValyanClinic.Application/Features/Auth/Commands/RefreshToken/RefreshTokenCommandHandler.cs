using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Auth.Commands.Login;
using ValyanClinic.Application.Common.Configuration;

namespace ValyanClinic.Application.Features.Auth.Commands.RefreshToken;

/// <summary>
/// Handler pentru refresh token — validează token-ul vechi și generează o pereche nouă.
///
/// Ordinea contează: validăm token-ul și starea contului ÎNAINTE de a roti. Anterior
/// rotația se făcea prima, deci un cont dezactivat primea totuși un token nou în DB.
///
/// Un token deja revocat, prezentat din nou, este semnalul clasic de furt: atacatorul
/// folosește o copie a cookie-ului după ce utilizatorul legitim a rotit-o (sau invers).
/// În acest caz revocăm întregul lanț de token-uri al utilizatorului, nu doar respingem
/// cererea — altfel sesiunea atacatorului ar rămâne activă.
///
/// Permisiunile sunt citite din cache dacă sunt disponibile, evitând un DB call redundant.
/// </summary>
public sealed class RefreshTokenCommandHandler(
    IAuthRepository authRepository,
    ITokenService tokenService,
    IPermissionRepository permissionRepository,
    IOptions<JwtOptions> jwtOptions,
    IMemoryCache cache)
    : IRequestHandler<RefreshTokenCommand, Result<LoginResponseDto>>
{
    public async Task<Result<LoginResponseDto>> Handle(
        RefreshTokenCommand request, CancellationToken ct)
    {
        // 1. Căutare refresh token în DB (după hash — valoarea în clar nu e stocată)
        var existingToken = await authRepository.GetRefreshTokenAsync(request.Token, ct);

        if (existingToken is null)
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidToken);

        // 2. Detecție de reutilizare — un token revocat prezentat din nou înseamnă că
        //    o copie a lui circulă. Revocăm tot lanțul utilizatorului, forțând un login nou.
        if (existingToken.IsRevoked)
        {
            await authRepository.RevokeAllRefreshTokensAsync(existingToken.UserId, ct);
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.TokenReuseDetected);
        }

        if (!existingToken.IsActive)
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidToken);

        // 3. Starea contului se verifică înainte de rotație — un cont dezactivat
        //    nu trebuie să primească un token nou.
        var user = await authRepository.GetUserByIdForTokenAsync(existingToken.UserId, ct);

        if (user is null || !user.IsActive)
        {
            await authRepository.RevokeAllRefreshTokensAsync(existingToken.UserId, ct);
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.AccountInactive);
        }

        // 4. Rotație atomică — revocarea vechiului token și inserarea celui nou într-o
        //    singură tranzacție. Eșuează dacă o cerere concurentă a rotit deja token-ul.
        var newRefreshToken = tokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.Now.AddDays(jwtOptions.Value.RefreshTokenExpiryDays);

        var rotated = await authRepository.RotateRefreshTokenAsync(
            request.Token, newRefreshToken, user.Id, refreshExpiry, request.IpAddress, ct);

        if (!rotated)
            return Result<LoginResponseDto>.Unauthorized(ErrorMessages.Auth.InvalidToken);

        // 5. Generare access token (include roleId claim)
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        var accessToken = tokenService.GenerateAccessToken(
            user.Id, user.ClinicId, user.Email, fullName, user.RoleCode, user.RoleId);

        // 6. Încărcare permisiuni efective — din cache dacă disponibile, altfel din DB
        var cacheVersion = cache.Get<long>(PermissionCacheKeys.Version);
        var dtoCacheKey = PermissionCacheKeys.DtoForUser(user.Id, cacheVersion);

        if (!cache.TryGetValue(dtoCacheKey, out IReadOnlyList<UserModulePermissionDto>? effectivePermissions)
            || effectivePermissions is null)
        {
            effectivePermissions = await permissionRepository.GetEffectiveByUserAsync(
                user.Id, user.RoleId, ct);

            // Populăm ambele cache-uri (auth + DTO) pentru viitoarele request-uri
            cache.Set(
                PermissionCacheKeys.ForUser(user.Id, cacheVersion),
                effectivePermissions.ToDictionary(p => p.ModuleCode, p => p.AccessLevel),
                PermissionCacheKeys.Ttl);
            cache.Set(dtoCacheKey, effectivePermissions, PermissionCacheKeys.Ttl);
        }

        var permissions = effectivePermissions
            .Select(p => new ModulePermissionDto
            {
                Module = p.ModuleCode,
                Level = p.AccessLevel,
                IsOverridden = p.IsOverridden
            })
            .ToList();

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
                RoleId = user.RoleId.ToString(),
                ClinicId = user.ClinicId.ToString(),
                DoctorId = user.DoctorId?.ToString(),
            },
            Permissions = permissions
        };

        return Result<LoginResponseDto>.Success(response);
    }
}
