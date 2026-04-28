using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ===== Dapper — DateTime marcat ca Local (ora României) =====
        SqlMapper.AddTypeHandler(new LocalDateTimeTypeHandler());

        // ===== Opțiuni strongly-typed =====
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
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
        services.AddScoped<IICD10Repository, ICD10Repository>();

        // ===== Servicii =====
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<ICnasNomenclatorService, CnasNomenclatorService>();
        services.AddScoped<IAnmNomenclatorService, AnmNomenclatorService>();
        services.AddScoped<ILabPdfParser, LabPdfParser>();
        services.AddHostedService<CnasSyncHostedService>();
        services.AddHostedService<AnmSyncHostedService>();

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

        // ===== Autorizare dinamică — RBAC cu [HasAccess] =====
        services.AddMemoryCache();
        services.AddScoped<IAuthorizationHandler, ModuleAccessAuthorizationHandler>();
        services.AddSingleton<IAuthorizationPolicyProvider, ModuleAccessPolicyProvider>();

        return services;
    }
}
