using Asp.Versioning;
using Asp.Versioning.ApiExplorer;
using System.Globalization;
using System.IO.Compression;
using System.Reflection;
using System.Threading.RateLimiting;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Writers;
using Serilog;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;
using ValyanClinic.API.Configuration;
using ValyanClinic.API.Filters;
using ValyanClinic.API.Middleware;
using ValyanClinic.Application.Common.Behaviors;
using ValyanClinic.Infrastructure;
using ValyanClinic.Application.Common.Configuration;
using ValyanClinic.Infrastructure.Configuration;

// ===== Serilog bootstrap logger (înainte de a construi aplicația) =====
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Pornire ValyanClinic API...");

    var builder = WebApplication.CreateBuilder(args);

    // ===== Serilog (citit din appsettings.json) =====
    builder.Host.UseSerilog((context, services, loggerConfig) =>
        loggerConfig.ReadFrom.Configuration(context.Configuration));

    // ===== Cultură România — formatare date/sume server-side (PDF-uri, rapoarte) =====
    var roCulture = new CultureInfo("ro-RO");
    CultureInfo.DefaultThreadCurrentCulture   = roCulture;
    CultureInfo.DefaultThreadCurrentUICulture = roCulture;

    // ===== Infrastructure (Dapper, Auth, JWT, Options) =====
    builder.Services.AddInfrastructure(builder.Configuration);

    // ===== MediatR (scanare automată a handler-elor din Application) =====
    builder.Services.AddMediatR(cfg =>
    {
        cfg.RegisterServicesFromAssembly(
            typeof(ValyanClinic.Application.Common.Models.Result<>).Assembly);
        cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
        cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
    });

    // ===== FluentValidation =====
    builder.Services.AddValidatorsFromAssembly(
        typeof(ValyanClinic.Application.Common.Models.Result<>).Assembly);

    // ===== Autorizare — politicile dinamice [HasAccess] sunt gestionate de ModuleAccessPolicyProvider =====
    // Politicile statice rămân pentru backward compatibility (vor fi înlocuite treptat cu [HasAccess])
    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("AdminOnly",        policy => policy.RequireRole("Admin"));
        options.AddPolicy("DoctorOrAdmin",    policy => policy.RequireRole("Admin", "Doctor"));
        options.AddPolicy("MedicalStaff",     policy => policy.RequireRole("Admin", "Doctor", "Nurse"));
        options.AddPolicy("CanManagePatients",policy => policy.RequireRole("Admin", "Doctor", "Nurse", "Receptionist"));
    });

    // ===== CORS =====
    var corsOptions = builder.Configuration
        .GetSection(CorsOptions.SectionName)
        .Get<CorsOptions>() ?? new CorsOptions();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("ValyanClinicCors", policy =>
        {
            policy.WithOrigins(corsOptions.AllowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    // ===== Health Checks =====
    builder.Services.AddHealthChecks()
        .AddSqlServer(
            connectionString: builder.Configuration.GetConnectionString("DefaultConnection")!,
            name: "sql-server",
            tags: ["db", "ready"]);

    // ===== API Versioning =====
    builder.Services.AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true;
    }).AddApiExplorer(options =>
    {
        // formatul grupului: "v1", "v2" etc.
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = true;
    });

    // ===== Swagger/OpenAPI =====
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddTransient<IConfigureOptions<SwaggerGenOptions>, ConfigureSwaggerOptions>();
    builder.Services.AddSwaggerGen(options =>
    {
        options.OperationFilter<IdempotencyHeaderOperationFilter>();
    });

    // ===== Response Compression (Brotli preferred, Gzip fallback) =====
    builder.Services.AddResponseCompression(options =>
    {
        // EnableForHttps: BREACH nu este un risc pentru acest API — nu reflectăm
        // input de utilizator în răspunsuri neautentificate, toate endpoint-urile cer JWT.
        options.EnableForHttps = true;
        options.Providers.Add<BrotliCompressionProvider>();
        options.Providers.Add<GzipCompressionProvider>();
        options.MimeTypes = ResponseCompressionDefaults.MimeTypes
            .Concat(["application/json"]);
    });
    builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
        options.Level = CompressionLevel.Fastest);
    builder.Services.Configure<GzipCompressionProviderOptions>(options =>
        options.Level = CompressionLevel.Fastest);

    // ===== Controllers =====
    builder.Services.AddControllers();

    // ===== Rate Limiting (built-in ASP.NET Core, .NET 7+) =====
    {
        var rlSection   = builder.Configuration.GetSection(RateLimitingOptions.SectionName);
        var loginMax    = rlSection.GetValue<int>("LoginMaxAttempts",    5);
        var loginWindow = rlSection.GetValue<int>("LoginWindowMinutes", 15);
        var apiMax      = rlSection.GetValue<int>("GeneralMaxRequests", 100);
        var apiWindow   = rlSection.GetValue<int>("GeneralWindowSeconds", 60);

        builder.Services.AddRateLimiter(rl =>
        {
            // Limită globală per IP — sliding window pe toate request-urile
            rl.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit          = apiMax,
                        Window               = TimeSpan.FromSeconds(apiWindow),
                        SegmentsPerWindow    = 4,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit           = 0
                    }));

            // Policy strictă per IP — fixed window pentru login/refresh (anti brute-force)
            rl.AddPolicy("login", ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit          = loginMax,
                        Window               = TimeSpan.FromMinutes(loginWindow),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit           = 0
                    }));

            rl.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            rl.OnRejected = async (ctx, ct) =>
            {
                ctx.HttpContext.Response.StatusCode  = StatusCodes.Status429TooManyRequests;
                ctx.HttpContext.Response.ContentType = "application/json";
                if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    ctx.HttpContext.Response.Headers.RetryAfter =
                        ((int)retryAfter.TotalSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
                await ctx.HttpContext.Response.WriteAsync(
                    "{\"success\":false,\"data\":null,\"errors\":[\"Prea multe cereri. Vă rugăm să așteptați.\"],\"meta\":null}",
                    ct);
            };
        });
    }

    // ===== Build app =====
    var app = builder.Build();

    // ===== Schema export mode — fără HTTP, folosit de generate-openapi.ps1 =====
    // Exemplu: dotnet run --project ... -- --export-openapi --output ../../openapi/openapi-v1.json
    if (args.Contains("--export-openapi"))
    {
        var outputPath = args.SkipWhile(a => a != "--output").Skip(1).FirstOrDefault()
                         ?? "openapi-v1.json";

        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath))!);

        var swaggerProvider = app.Services.GetRequiredService<ISwaggerProvider>();
        var document = swaggerProvider.GetSwagger("v1");

        using var stream = File.Create(outputPath);
        using var writer = new StreamWriter(stream);
        document.SerializeAsV3(new OpenApiJsonWriter(writer));

        Log.Information("Schema OpenAPI exportat la: {Path}", Path.GetFullPath(outputPath));
        return 0;
    }

    // ===== Middleware Pipeline =====
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseResponseCompression();
    app.UseMiddleware<IdempotencyMiddleware>();
    app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

    // ===== Security Headers =====
    app.Use(async (context, next) =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"]        = "DENY";
        context.Response.Headers["Content-Security-Policy"] = "default-src 'none'";
        if (!app.Environment.IsDevelopment())
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        await next();
    });

    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(ui =>
        {
            // Generăm un endpoint Swagger pentru fiecare versiune API descoperită
            var apiVersionDescriptionProvider =
                app.Services.GetRequiredService<IApiVersionDescriptionProvider>();

            foreach (var description in apiVersionDescriptionProvider.ApiVersionDescriptions)
            {
                ui.SwaggerEndpoint(
                    $"/swagger/{description.GroupName}/swagger.json",
                    $"ValyanClinic API {description.GroupName.ToUpperInvariant()}");
            }
        });
    }

    // HTTPS redirect doar în producție — în development, Vite proxy gestionează conexiunea
    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseRateLimiter();

    app.UseCors("ValyanClinicCors");

    app.UseAuthentication();

    // Autorizare — controller-ele care nu au [AllowAnonymous] cer JWT valid
    app.UseAuthorization();

    app.MapControllers();

    // ===== Health Check Endpoints =====
    app.MapHealthChecks("/health", new HealthCheckOptions
    {
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                status = report.Status.ToString(),
                checks = report.Entries.Select(e => new
                {
                    name   = e.Key,
                    status = e.Value.Status.ToString(),
                    exception = e.Value.Exception?.Message
                })
            });
            await context.Response.WriteAsync(result);
        }
    });

    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready")
    });

    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = _ => false
    });

    // ===== Version Endpoint =====
    app.MapGet("/api/version", (IHostEnvironment env) =>
    {
        var version = typeof(Program).Assembly
            .GetCustomAttribute<System.Reflection.AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion ?? "unknown";
        return Results.Ok(new { version, environment = env.EnvironmentName });
    }).AllowAnonymous();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Aplicația a eșuat la pornire.");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}

return 0;

