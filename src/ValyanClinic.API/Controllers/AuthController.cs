using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    /// <summary>Login cu email/username + parolă.</summary>
    [AllowAnonymous]
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
    [AllowAnonymous]
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
            Path = "/api/auth"
        };

        Response.Cookies.Append(RefreshTokenCookieName, token, cookieOptions);
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            Path = "/api/auth"
        });
    }
}

/// <summary>Request body pentru login.</summary>
public sealed record LoginRequest(string Email, string Password);
