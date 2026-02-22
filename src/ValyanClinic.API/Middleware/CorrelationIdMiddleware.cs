using Serilog.Context;

namespace ValyanClinic.API.Middleware;

/// <summary>
/// Middleware care extrage sau generează un Correlation ID pentru fiecare request.
/// Propagat în response headers și în Serilog LogContext pentru tracing complet.
/// </summary>
public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        // Push în Serilog LogContext — apare automat în toate log-urile din request
        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await next(context);
        }
    }
}
