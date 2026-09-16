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
using ValyanClinic.Infrastructure.Data;
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

    // ===== Configurație sensibilă — nu este versionată în appsettings.json =====
    // Development: dotnet user-secrets. Alte medii: variabile de mediu / Key Vault.
    // Verificăm explicit aici, pentru un mesaj util în locul unei erori SQL obscure
    // la primul query. Secretul JWT e validat separat, în AddInfrastructure.
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException(
            "ConnectionStrings:DefaultConnection lipsește din configurație. În Development: " +
            "dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"<connection string>\" " +
            "--project src/ValyanClinic.API. " +
            "În alte medii: variabila de mediu ConnectionStrings__DefaultConnection.");
    }

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

    // ===== Autorizare — politicile [HasAccess] sunt generate de ModuleAccessPolicyProvider =====
    // Nu mai există politici statice de rol. Cele patru care existau (AdminOnly,
    // DoctorOrAdmin, MedicalStaff, CanManagePatients) nu erau folosite de niciun
    // endpoint și, în plus, comparau cu forme PascalCase („Admin", „Doctor") care nu
    // corespund niciunui cod de rol real — codurile din Roles.Code sunt lowercase.
    // Compararea valorii unui claim e ordinală și case-sensitive, deci oricare dintre
    // ele ar fi produs un 403 permanent și tăcut la prima utilizare, exact cum s-a
    // întâmplat cu AdminOnly pe endpoint-ul de reset al parolei.
    // Restricțiile de rol se exprimă în handler, unde sunt unit-testabile.
    builder.Services.AddAuthorization();

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
            connectionString: connectionString,
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
        var rlSection     = builder.Configuration.GetSection(RateLimitingOptions.SectionName);
        var loginMax      = rlSection.GetValue<int>("LoginMaxAttempts",    30);
        var loginWindow   = rlSection.GetValue<int>("LoginWindowMinutes",  15);
        var refreshMax    = rlSection.GetValue<int>("RefreshMaxRequests",  60);
        var refreshWindow = rlSection.GetValue<int>("RefreshWindowMinutes", 15);
        var apiMax        = rlSection.GetValue<int>("GeneralMaxRequests",  100);
        var apiWindow     = rlSection.GetValue<int>("GeneralWindowSeconds", 60);

        // Partiție per utilizator autentificat, cu IP-ul ca rezervă. O clinică
        // întreagă poate ieși la internet printr-un singur IP: fără această
        // separare, activitatea normală a câtorva colegi epuizează cota comună.
        // Funcționează pentru că UseRateLimiter() e plasat după UseAuthentication().
        static string PartitionByUserOrIp(HttpContext ctx)
        {
            var userId = ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return !string.IsNullOrEmpty(userId)
                ? $"user:{userId}"
                : $"ip:{ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
        }

        builder.Services.AddRateLimiter(rl =>
        {
            // Limită globală — sliding window, per utilizator sau per IP
            rl.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: PartitionByUserOrIp(ctx),
                    factory: _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit          = apiMax,
                        Window               = TimeSpan.FromSeconds(apiWindow),
                        SegmentsPerWindow    = 4,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit           = 0
                    }));

            // Login — limită anti-flood per IP. Protecția împotriva forței brute pe un
            // cont anume e blocarea per cont (Security:MaxFailedLoginAttempts), nu aceasta;
            // de aceea limita e deliberat mai mare decât pragul de blocare.
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

            // Refresh — politică separată și mai permisivă. Rotația token-ului e o
            // operație legitimă declanșată la 15 minute de fiecare tab deschis, deci
            // limita de login ar fi epuizată de utilizare normală.
            rl.AddPolicy("refresh", ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit          = refreshMax,
                        Window               = TimeSpan.FromMinutes(refreshWindow),
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

    // ===== Migrate mode — rulat de migrate.ps1, fără HTTP server =====
    // Exemplu: dotnet run --project ... -- --migrate
    if (args.Contains("--migrate"))
    {
        var migratorLogger = app.Services.GetRequiredService<ILogger<DatabaseMigrator>>();
        var migrator = new DatabaseMigrator(connectionString, migratorLogger);
        return migrator.Run() ? 0 : 1;
    }

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

    app.UseCors("ValyanClinicCors");

    app.UseAuthentication();

    // Dupa UseAuthentication: limitarea globala partitioneaza pe utilizator cand
    // exista claims, si abia altfel pe IP. Inainte de autentificare, ctx.User e gol
    // si toata clinica ar imparti cota unui singur IP.
    app.UseRateLimiter();

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

