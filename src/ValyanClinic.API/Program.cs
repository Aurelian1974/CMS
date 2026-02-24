using System.Globalization;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Serilog;
using ValyanClinic.API.Middleware;
using ValyanClinic.Infrastructure;
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
        cfg.RegisterServicesFromAssembly(
            typeof(ValyanClinic.Application.Common.Models.Result<>).Assembly));

    // ===== FluentValidation =====
    builder.Services.AddValidatorsFromAssembly(
        typeof(ValyanClinic.Application.Common.Models.Result<>).Assembly);

    // ===== Autorizare =====
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

    // ===== Controllers =====
    builder.Services.AddControllers();

    // ===== Build app =====
    var app = builder.Build();

    // ===== Middleware Pipeline =====
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

    app.UseSerilogRequestLogging();

    app.UseHttpsRedirection();
    app.UseCors("ValyanClinicCors");

    app.UseAuthentication();

    // DEV: Bypass autentificare — injectează claims mock când nu există JWT valid
    if (app.Environment.IsDevelopment())
    {
        app.UseMiddleware<DevAuthBypassMiddleware>();
    }

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

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Aplicația a eșuat la pornire.");
}
finally
{
    Log.CloseAndFlush();
}

