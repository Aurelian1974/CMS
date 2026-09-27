namespace ValyanClinic.FiscalBridge.Security;

/// <summary>
/// Chrome / Edge cer acordul explicit al serviciului local când o pagină din rețea apelează
/// 127.0.0.1 (Private Network Access): răspundem la preflight cu antetul de permisiune.
/// Originea e verificată separat, de politica CORS.
/// </summary>
public sealed class PrivateNetworkAccessMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        if (HttpMethods.IsOptions(context.Request.Method)
            && context.Request.Headers.TryGetValue("Access-Control-Request-Private-Network", out var value)
            && string.Equals(value, "true", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
        }
        return next(context);
    }
}
