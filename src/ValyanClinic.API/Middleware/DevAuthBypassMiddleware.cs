using System.Security.Claims;

namespace ValyanClinic.API.Middleware;

/// <summary>
/// Middleware pentru development — injectează claims autentificare mock
/// când nu există un JWT valid pe request. Permite testarea UI-ului
/// fără a avea nevoie de sistem de autentificare funcțional.
///
/// ATENȚIE: Se activează DOAR în environment Development. Nu se înregistrează în producție.
/// </summary>
public sealed class DevAuthBypassMiddleware(RequestDelegate next)
{
    // GUID-uri dev — corespund cu seed-ul din baza de date
    private static readonly string DevClinicId = "A0000001-0000-0000-0000-000000000001";
    private static readonly string DevUserId   = "B0000001-0000-0000-0000-000000000001";

    public async Task InvokeAsync(HttpContext context)
    {
        // Dacă utilizatorul NU este deja autentificat, injectăm claims mock
        if (context.User.Identity?.IsAuthenticated != true)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, DevUserId),
                new Claim("clinicId", DevClinicId),
                new Claim(ClaimTypes.Email, "admin@valyanclinic.dev"),
                new Claim("fullName", "Admin Dev"),
                new Claim(ClaimTypes.Role, "Admin"),
            };

            var identity  = new ClaimsIdentity(claims, "DevBypass");
            var principal = new ClaimsPrincipal(identity);

            context.User = principal;
        }

        await next(context);
    }
}
