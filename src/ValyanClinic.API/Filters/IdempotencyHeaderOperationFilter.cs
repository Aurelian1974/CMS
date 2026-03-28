using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ValyanClinic.API.Filters;

/// <summary>
/// Adaugă documentarea header-ului X-Idempotency-Key la toate operațiunile POST din Swagger.
/// </summary>
public sealed class IdempotencyHeaderOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (!string.Equals(context.ApiDescription.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            return;

        operation.Parameters ??= [];

        operation.Parameters.Add(new OpenApiParameter
        {
            Name     = "X-Idempotency-Key",
            In       = ParameterLocation.Header,
            Required = false,
            Schema   = new OpenApiSchema { Type = "string", MaxLength = 128 },
            Description =
                "UUID opțional pentru idempotency. " +
                "Răspunsul este cașat 5 minute — request-urile duplicate cu același key " +
                "returnează același rezultat fără re-procesare. " +
                "Recomandat la crearea de resurse pentru a preveni duplicatele în caz de retry."
        });
    }
}
