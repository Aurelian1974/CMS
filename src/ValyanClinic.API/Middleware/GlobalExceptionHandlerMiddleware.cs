using System.Net;
using Microsoft.Data.SqlClient;
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
        // 547 = FK/CHECK, 2601/2627 = unique — date invalide trimise de client, nu eroare de server
        catch (SqlException sqlEx) when (sqlEx.Number is 547 or 2601 or 2627)
        {
            var correlationId = context.Items["CorrelationId"]?.ToString() ?? "N/A";

            logger.LogWarning(sqlEx,
                "Violare de constrângere SQL. CorrelationId: {CorrelationId}, Path: {Path}, Number: {Number}",
                correlationId,
                context.Request.Path,
                sqlEx.Number);

            context.Response.StatusCode  = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new ApiResponse<object>(
                Success: false,
                Data: null,
                Message: "Datele trimise fac referire la înregistrări inexistente sau duplicate.",
                Errors: null));
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
