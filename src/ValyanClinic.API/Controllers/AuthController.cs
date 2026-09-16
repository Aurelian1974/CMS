using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Auth.Commands.Login;
using ValyanClinic.Application.Features.Auth.Commands.Logout;
using ValyanClinic.Application.Features.Auth.Commands.RefreshToken;
using ValyanClinic.Application.Common.Configuration;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru autentificare — login, refresh token, logout.
/// </summary>
public class AuthController(IOptions<JwtOptions> jwtOptions) : BaseApiController
{
    private const string RefreshTokenCookieName = "refreshToken";

    /// <summary>
    /// Path-ul pe care browserul trimite cookie-ul de refresh. Trebuie să fie un prefix al
    /// rutei reale a controller-ului (<c>api/v{version}/[controller]</c>) — path matching-ul
    /// din RFC 6265 este prefix exact și case-sensitive, deci o valoare greșită face ca
    /// cookie-ul să nu fie trimis niciodată (și nici să nu poată fi șters).
    /// La introducerea unei versiuni noi de API, actualizați constanta. Testul e2e
    /// „sesiunea supraviețuiește expirării access token-ului" (auth.spec.ts) prinde regresia.
    /// </summary>
    private const string RefreshTokenCookiePath = "/api/v1/Auth";

    /// <summary>Login cu email/username + parolă.</summary>
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request, CancellationToken ct)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await Mediator.Send(command, ct);

        if (!result.IsSuccess)
            return HandleResult(result);

        // Setăm refresh token-ul ca HttpOnly cookie
        SetRefreshTokenCookie(result.Value!.RefreshToken);

        // Returnăm access token + user info + permissions (fără refresh token în body)
        var response = new
        {
            accessToken = result.Value.AccessToken,
            user = result.Value.User,
            permissions = result.Value.Permissions
        };

        return Ok(new ApiResponse<object>(true, response, null, null));
    }

    /// <summary>Reîmprospătare access token folosind refresh token din cookie.</summary>
    [AllowAnonymous]
    [EnableRateLimiting("refresh")]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];

        if (string.IsNullOrWhiteSpace(refreshToken))
            return Unauthorized(new ApiResponse<object>(false, null, "Refresh token lipsă.", null));

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var command = new RefreshTokenCommand(refreshToken, ipAddress);
        var result = await Mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            // Cookie expirat/invalid — ștergem cookie-ul
            ClearRefreshTokenCookie();
            return HandleResult(result);
        }

        // Setăm noul refresh token ca cookie
        SetRefreshTokenCookie(result.Value!.RefreshToken);

        var response = new
        {
            accessToken = result.Value.AccessToken,
            user = result.Value.User,
            permissions = result.Value.Permissions
        };

        return Ok(new ApiResponse<object>(true, response, null, null));
    }

    /// <summary>Logout — revocă refresh token din cookie.</summary>
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        var command = new LogoutCommand(refreshToken);
        await Mediator.Send(command, ct);

        ClearRefreshTokenCookie();

        return Ok(new ApiResponse<bool>(true, true, null, null));
    }

    // ===== Cookie helpers =====

    private void SetRefreshTokenCookie(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.RequestServices
                .GetRequiredService<IWebHostEnvironment>().IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(jwtOptions.Value.RefreshTokenExpiryDays),
            Path = RefreshTokenCookiePath
        };

        Response.Cookies.Append(RefreshTokenCookieName, token, cookieOptions);
    }

    private void ClearRefreshTokenCookie()
    {
        // Path-ul trebuie să fie identic cu cel de la Append — altfel cookie-ul nu se șterge.
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            Path = RefreshTokenCookiePath
        });
    }
}

/// <summary>Request body pentru login.</summary>
public sealed record LoginRequest(string Email, string Password);
