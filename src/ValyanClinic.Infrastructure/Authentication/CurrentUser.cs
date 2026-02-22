using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using ValyanClinic.Application.Common.Interfaces;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>
/// Implementare ICurrentUser care extrage datele utilizatorului din JWT claims.
/// </summary>
public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal User =>
        httpContextAccessor.HttpContext?.User
        ?? throw new UnauthorizedAccessException("Utilizator neautentificat.");

    public Guid Id =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Claim 'sub' lipsă din token."));

    public Guid ClinicId =>
        Guid.Parse(User.FindFirstValue("clinicId")
            ?? throw new UnauthorizedAccessException("Claim 'clinicId' lipsă din token."));

    public string Email =>
        User.FindFirstValue(ClaimTypes.Email)
            ?? throw new UnauthorizedAccessException("Claim 'email' lipsă din token.");

    public string FullName =>
        User.FindFirstValue("fullName")
            ?? throw new UnauthorizedAccessException("Claim 'fullName' lipsă din token.");

    public string Role =>
        User.FindFirstValue(ClaimTypes.Role)
            ?? throw new UnauthorizedAccessException("Claim 'role' lipsă din token.");

    public bool IsInRole(string role) => User.IsInRole(role);
}
