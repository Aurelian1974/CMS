using Asp.Versioning.ApiExplorer;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ValyanClinic.API.Configuration;

/// <summary>
/// Configurează automat câte un SwaggerDoc pentru fiecare versiune API descoperită.
/// </summary>
public sealed class ConfigureSwaggerOptions(IApiVersionDescriptionProvider provider)
    : IConfigureOptions<SwaggerGenOptions>
{
    public void Configure(SwaggerGenOptions options)
    {
        foreach (var description in provider.ApiVersionDescriptions)
        {
            options.SwaggerDoc(description.GroupName, new OpenApiInfo
            {
                Title   = "ValyanClinic API",
                Version = description.GroupName,
                Description = description.IsDeprecated
                    ? "Această versiune API este deprecată."
                    : null
            });
        }

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Type        = SecuritySchemeType.Http,
            Scheme      = "bearer",
            BearerFormat = "JWT",
            Description = "Introdu token-ul JWT (fără prefixul 'Bearer')"
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id   = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    }
}
