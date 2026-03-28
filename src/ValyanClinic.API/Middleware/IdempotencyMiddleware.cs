using Microsoft.Extensions.Caching.Memory;

namespace ValyanClinic.API.Middleware;

/// <summary>
/// Middleware care implementează idempotency pentru request-urile POST.
/// Dacă clientul trimite header-ul X-Idempotency-Key, răspunsul este cașat 5 minute.
/// Request-urile duplicate cu același key returnează răspunsul inițial fără re-procesare.
/// </summary>
public sealed class IdempotencyMiddleware(RequestDelegate next, IMemoryCache cache)
{
    private const string HeaderName    = "X-Idempotency-Key";
    private const string ReplayedHeader = "X-Idempotency-Replayed";
    private const int    MaxKeyLength  = 128;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public async Task InvokeAsync(HttpContext context)
    {
        // Aplicăm doar pe POST
        if (!HttpMethods.IsPost(context.Request.Method))
        {
            await next(context);
            return;
        }

        var idempotencyKey = context.Request.Headers[HeaderName].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            await next(context);
            return;
        }

        // Sanitizare key — limităm lungimea pentru a evita abuzul de memorie
        if (idempotencyKey.Length > MaxKeyLength)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = $"X-Idempotency-Key depășește lungimea maximă ({MaxKeyLength} caractere)."
            });
            return;
        }

        var cacheKey = $"idempotency:{idempotencyKey}";

        // Cache hit — returnăm răspunsul anterior fără re-procesare
        if (cache.TryGetValue(cacheKey, out IdempotencyCachedResponse? cached) && cached is not null)
        {
            context.Response.StatusCode  = cached.StatusCode;
            context.Response.ContentType = cached.ContentType;
            context.Response.Headers[ReplayedHeader] = "true";
            await context.Response.Body.WriteAsync(cached.Body);
            return;
        }

        // Cache miss — procesăm request-ul și capturăm răspunsul
        var originalBody = context.Response.Body;
        using var buffer = new MemoryStream();
        context.Response.Body = buffer;

        try
        {
            await next(context);
        }
        finally
        {
            context.Response.Body = originalBody;
        }

        var responseBytes = buffer.ToArray();

        // Cașăm doar răspunsurile de succes (2xx)
        if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
        {
            cache.Set(
                cacheKey,
                new IdempotencyCachedResponse(
                    context.Response.StatusCode,
                    context.Response.ContentType ?? "application/json",
                    responseBytes),
                CacheDuration);
        }

        await originalBody.WriteAsync(responseBytes);
    }

    private sealed record IdempotencyCachedResponse(
        int    StatusCode,
        string ContentType,
        byte[] Body);
}
