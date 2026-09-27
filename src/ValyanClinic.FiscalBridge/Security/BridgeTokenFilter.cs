using System.Security.Cryptography;
using System.Text;

namespace ValyanClinic.FiscalBridge.Security;

/// <summary>
/// Verifică antetul <c>X-Bridge-Token</c>. Bridge-ul ascultă doar pe loopback, dar orice pagină
/// deschisă în browserul recepției îl poate apela — token-ul (plus CORS) oprește site-urile străine.
/// </summary>
public sealed class BridgeTokenFilter(ISecretStore secrets) : IEndpointFilter
{
    public const string HeaderName = "X-Bridge-Token";

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var provided = context.HttpContext.Request.Headers[HeaderName].ToString();
        return IsValid(provided, secrets.GetOrCreateToken())
            ? await next(context)
            : Results.Json(new { message = "Token fiscal bridge invalid. Asociați din nou stația în Setări financiare." },
                statusCode: StatusCodes.Status401Unauthorized);
    }

    /// <summary>Comparație în timp constant — nu dezvăluie prin timp câte caractere se potrivesc.</summary>
    public static bool IsValid(string? provided, string expected)
    {
        if (string.IsNullOrEmpty(provided)) return false;
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(provided), Encoding.UTF8.GetBytes(expected));
    }
}
