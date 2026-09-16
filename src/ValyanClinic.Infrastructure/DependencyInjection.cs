using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Common.Configuration;
using ValyanClinic.Infrastructure.Configuration;
using ValyanClinic.Infrastructure.Data;
using ValyanClinic.Infrastructure.Data.Repositories;
using ValyanClinic.Infrastructure.Services;

namespace ValyanClinic.Infrastructure;

/// <summary>
/// Extensii DI pentru înregistrarea tuturor serviciilor din Infrastructure.
/// </summary>
public static class DependencyInjection
{
    /// <summary>Lungimea minimă a cheii HMAC-SHA256, în bytes.</summary>
    private const int MinimumJwtSecretBytes = 32;

    /// <summary>
    /// Fragment din secretul de development versionat anterior în appsettings.json.
    /// Orice secret care îl conține este respins la pornire.
    /// </summary>
    private const string CompromisedSecretMarker = "ValyanClinic_Dev_Secret_Key";

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ===== Dapper — DateTime marcat ca Local (ora României) =====
        SqlMapper.AddTypeHandler(new LocalDateTimeTypeHandler());

        // ===== Dapper — DateOnly / DateOnly? (SQL DATE → DateOnly) =====
        SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());
        SqlMapper.AddTypeHandler(new NullableDateOnlyTypeHandler());

        // ===== Opțiuni strongly-typed =====
        // JwtOptions se înregistrează mai jos, cu validare la pornire.
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.Configure<PaginationOptions>(configuration.GetSection(PaginationOptions.SectionName));
        services.Configure<CorsOptions>(configuration.GetSection(CorsOptions.SectionName));
        services.Configure<SecurityOptions>(configuration.GetSection(SecurityOptions.SectionName));
        services.Configure<RateLimitingOptions>(configuration.GetSection(RateLimitingOptions.SectionName));
        services.Configure<CnasOptions>(configuration.GetSection(CnasOptions.SectionName));
        services.Configure<AnmOptions>(configuration.GetSection(AnmOptions.SectionName));

        // ===== Baza de date =====
        services.AddSingleton<DapperContext>();

        // ===== Repositories =====
        services.AddScoped<ISpecialtyRepository, SpecialtyRepository>();
        services.AddScoped<IClinicRepository, ClinicRepository>();
        services.AddScoped<IClinicLocationRepository, ClinicLocationRepository>();
        services.AddScoped<IClinicCaenCodeRepository, ClinicCaenCodeRepository>();
        services.AddScoped<IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<IDoctorRepository, DoctorRepository>();
        services.AddScoped<IMedicalTitleRepository, MedicalTitleRepository>();
        services.AddScoped<IMedicalStaffRepository, MedicalStaffRepository>();
        services.AddScoped<IPatientRepository, PatientRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IConsultationRepository, ConsultationRepository>();
        services.AddScoped<IInvestigationRepository, InvestigationRepository>();
        services.AddScoped<IRecommendedAnalysisRepository, RecommendedAnalysisRepository>();
        services.AddScoped<IAnalysisDictionaryRepository, AnalysisDictionaryRepository>();
        services.AddScoped<IAnalysesResultRepository, AnalysesResultRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<INomenclatureLookupRepository, NomenclatureLookupRepository>();
        services.AddScoped<IGeographyRepository, GeographyRepository>();
        services.AddScoped<ICaenCodeRepository, CaenCodeRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();
        services.AddScoped<IScheduleRepository, ScheduleRepository>();
        services.AddScoped<ICnasSyncRepository, CnasSyncRepository>();
        services.AddScoped<IAnmSyncRepository, AnmSyncRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<ISecurityEventRepository, SecurityEventRepository>();
        services.AddScoped<IICD10Repository, ICD10Repository>();

        // ===== Servicii =====
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<ICnasNomenclatorService, CnasNomenclatorService>();
        services.AddScoped<IAnmNomenclatorService, AnmNomenclatorService>();
        services.AddScoped<ILabPdfParser, LabPdfParser>();
        services.AddHostedService<CnasSyncHostedService>();
        services.AddHostedService<AnmSyncHostedService>();
        services.AddHostedService<RefreshTokenCleanupHostedService>();

        // ===== HttpClient CNAS (URL-uri permise doar pe cnas.ro) =====
        services.AddHttpClient("CnasClient", client =>
        {
            client.DefaultRequestHeaders.Add("User-Agent", "ValyanClinic/1.0");
            client.Timeout = TimeSpan.FromMinutes(10);
        });

        // ===== HttpClient ANM (URL-uri permise doar pe nomenclator.anm.ro) =====
        services.AddHttpClient("AnmClient", client =>
        {
            client.DefaultRequestHeaders.Add("User-Agent", "ValyanClinic/1.0");
            client.Timeout = TimeSpan.FromMinutes(10);
        });

        // ===== Autentificare =====
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<IRequestContext, RequestContext>();
        services.AddScoped<ISecurityEventLogger, SecurityEventLogger>();
        services.AddScoped<ISecuritySettingsProvider, SecuritySettingsProvider>();

        // ===== JWT Authentication =====
        // Secretul nu are valoare implicită și nu este versionat în appsettings.json:
        // vine din user-secrets (Development) sau din variabile de mediu / Key Vault.
        // Validarea rulează la pornirea host-ului, deci o configurație greșită oprește
        // aplicația cu un mesaj explicit, în loc să producă token-uri nesemnate corect.
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(o => !string.IsNullOrWhiteSpace(o.Secret),
                "Jwt:Secret lipsește. În Development: " +
                "dotnet user-secrets set \"Jwt:Secret\" \"<secret>\" --project src/ValyanClinic.API. " +
                "În alte medii: variabila de mediu Jwt__Secret.")
            .Validate(o => string.IsNullOrWhiteSpace(o.Secret)
                           || Encoding.UTF8.GetByteCount(o.Secret) >= MinimumJwtSecretBytes,
                $"Jwt:Secret trebuie să aibă minimum {MinimumJwtSecretBytes} de bytes — " +
                "cerință pentru cheia HMAC-SHA256.")
            .Validate(o => !o.Secret.Contains(CompromisedSecretMarker, StringComparison.OrdinalIgnoreCase),
                "Secretul de development care a fost versionat în appsettings.json este " +
                "compromis permanent (rămâne în istoricul git) și nu mai poate fi folosit.")
            .Validate(o => !string.IsNullOrWhiteSpace(o.Issuer), "Jwt:Issuer lipsește din configurație.")
            .Validate(o => !string.IsNullOrWhiteSpace(o.Audience), "Jwt:Audience lipsește din configurație.")
            .ValidateOnStart();

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer();

        // Parametrii de validare se construiesc lazy, din JwtOptions deja validat.
        // Astfel modurile CLI (--migrate, --export-openapi), care nu pornesc pipeline-ul
        // HTTP, rulează fără a avea nevoie de secret.
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>>((bearer, jwtAccessor) =>
            {
                var jwt = jwtAccessor.Value;
                bearer.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
                    ValidateIssuer           = true,
                    ValidIssuer              = jwt.Issuer,
                    ValidateAudience         = true,
                    ValidAudience            = jwt.Audience,
                    ValidateLifetime         = true,
                    ClockSkew                = TimeSpan.Zero
                };
            });

        // ===== Autorizare dinamică — RBAC cu [HasAccess] =====
        services.AddMemoryCache();
        services.AddScoped<IAuthorizationHandler, ModuleAccessAuthorizationHandler>();
        services.AddSingleton<IAuthorizationPolicyProvider, ModuleAccessPolicyProvider>();

        return services;
    }
}
