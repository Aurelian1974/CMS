using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Infrastructure.Configuration;
using ValyanClinic.Infrastructure.Data;
using ValyanClinic.Infrastructure.Data.Repositories;

namespace ValyanClinic.Infrastructure;

/// <summary>
/// Extensii DI pentru înregistrarea tuturor serviciilor din Infrastructure.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ===== Opțiuni strongly-typed =====
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.Configure<PaginationOptions>(configuration.GetSection(PaginationOptions.SectionName));
        services.Configure<CorsOptions>(configuration.GetSection(CorsOptions.SectionName));
        services.Configure<SecurityOptions>(configuration.GetSection(SecurityOptions.SectionName));

        // ===== Baza de date =====
        services.AddSingleton<DapperContext>();

        // ===== Repositories =====
        services.AddScoped<ISpecialtyRepository, SpecialtyRepository>();
        services.AddScoped<IClinicRepository, ClinicRepository>();
        services.AddScoped<IClinicLocationRepository, ClinicLocationRepository>();

        // ===== Autentificare =====
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        // ===== JWT Authentication =====
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("Secțiunea 'Jwt' lipsă din configurație.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
                ValidateIssuer           = true,
                ValidIssuer              = jwtOptions.Issuer,
                ValidateAudience         = true,
                ValidAudience            = jwtOptions.Audience,
                ValidateLifetime         = true,
                ClockSkew                = TimeSpan.Zero
            };
        });

        return services;
    }
}
