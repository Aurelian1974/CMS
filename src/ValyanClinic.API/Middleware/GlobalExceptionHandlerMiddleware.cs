using System.Net;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.API.Middleware;

/// <summary>
/// Middleware global pentru prinderea excepțiilor neașteptate.
/// Returnează un răspuns JSON consistent și loghează eroarea cu Correlation ID.
/// </summary>
public sealed class GlobalExceptionHandlerMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionHandlerMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var correlationId = context.Items["CorrelationId"]?.ToString() ?? "N/A";

            logger.LogError(ex,
                "Eroare neașteptată. CorrelationId: {CorrelationId}, Path: {Path}",
                correlationId,
                context.Request.Path);

            context.Response.StatusCode  = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new ApiResponse<object>(
                Success: false,
                Data: null,
                Message: "A apărut o eroare internă. Contactați administratorul.",
                Errors: null));
        }
    }
}
