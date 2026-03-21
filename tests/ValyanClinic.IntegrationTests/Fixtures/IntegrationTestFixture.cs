using MediatR;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Respawn;
using Respawn.Graph;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure;
using ValyanClinic.Infrastructure.Data;

namespace ValyanClinic.IntegrationTests.Fixtures;

/// <summary>
/// Fixture partajat între toate testele de integrare.
/// Construiește un DI container real cu Infrastructure + MediatR,
/// se conectează la baza de date de test și gestionează cleanup prin Respawn.
/// </summary>
public sealed class IntegrationTestFixture : IAsyncLifetime
{
    // ── Configurare ──────────────────────────────────────────────────────────
    public  IConfiguration  Configuration   { get; private set; } = null!;
    public  string          ConnectionString { get; private set; } = null!;
    public  Guid            TestClinicId    { get; private set; }
    public  Guid            TestUserId      { get; private set; } = Guid.NewGuid();

    // ── DI ───────────────────────────────────────────────────────────────────
    public  IServiceProvider Services { get; private set; } = null!;

    // ── Respawn ──────────────────────────────────────────────────────────────
    private Respawner? _respawner;

    public async Task InitializeAsync()
    {
        Configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("testsettings.json", optional: false)
            .AddEnvironmentVariables("VALYAN_IT_")      // override din CI
            .Build();

        ConnectionString = Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Lipsă DefaultConnection în testsettings.json.");

        // Citim TestClinicId; dacă nu e configurat → îl determinăm din prima clinică din DB
        var rawId = Configuration["Integration:TestClinicId"];
        if (Guid.TryParse(rawId, out var cfgId) && cfgId != Guid.Empty)
        {
            TestClinicId = cfgId;
        }
        else
        {
            TestClinicId = await ResolveFirstClinicIdAsync();
            if (TestClinicId == Guid.Empty)
                throw new InvalidOperationException(
                    "Nu există nicio clinică în baza de date. " +
                    "Configurează Integration:TestClinicId în testsettings.json.");
        }

        Services = BuildServiceProvider();

        // Inițializare Respawn (checkpoint înainte de orice test de scriere)
        await using var conn = new SqlConnection(ConnectionString);
        await conn.OpenAsync();
        _respawner = await Respawner.CreateAsync(conn, new RespawnerOptions
        {
            TablesToIgnore =
            [
                // Date de referință — NU se șterg niciodată
                new("Clinics"), new("Roles"), new("Specialties"), new("MedicalTitles"),
                new("Genders"), new("BloodTypes"), new("AllergyTypes"), new("AllergySeverities"),
                new("Counties"), new("Localities"), new("CaenCodes"),
                new("schemaversions")
            ],
            // Ștergem numai tabelele tranzacționale ale clinicii de test
            TablesToInclude =
            [
                new("Patients"), new("PatientAllergies"), new("PatientDoctors"), new("PatientEmergencyContacts"),
                new("Doctors"),
                new("MedicalStaffMembers"),
                new("Users"), new("RefreshTokens"),
                new("Departments"), new("ClinicLocations"),
                new("ClinicAddresses"), new("ClinicBankAccounts"), new("ClinicContacts"), new("ClinicContactPersons"),
                new("ClinicCaenCodes"),
                new("RolePermissions"), new("UserPermissionOverrides")
            ],
            DbAdapter = DbAdapter.SqlServer
        });
    }

    public async Task DisposeAsync()
    {
        // Nimic de curățat — Respawn e folosit per-test-class prin ResetAsync()
        await Task.CompletedTask;
    }

    /// <summary>Resetează tabelele tranzacționale la starea checkpoint.</summary>
    public async Task ResetDatabaseAsync()
    {
        if (_respawner is null) return;
        await using var conn = new SqlConnection(ConnectionString);
        await conn.OpenAsync();
        await _respawner.ResetAsync(conn);
    }

    /// <summary>
    /// Creează un scope nou și returnează un ISender (MediatR) gata de utilizat.
    /// </summary>
    public ISender CreateSender() => Services.CreateScope().ServiceProvider.GetRequiredService<ISender>();

    /// <summary>Returnează un repository scoped din DI.</summary>
    public T GetRepository<T>() where T : notnull
        => Services.CreateScope().ServiceProvider.GetRequiredService<T>();

    // ─────────────────────────────────────────────────────────────────────────

    private IServiceProvider BuildServiceProvider()
    {
        var services = new ServiceCollection();

        services.AddSingleton(Configuration);
        services.AddLogging(b => b.AddConsole().SetMinimumLevel(LogLevel.Warning));
        services.AddMemoryCache();
        services.AddHttpContextAccessor();

        // Infrastructure: Dapper, repositories, token service, BCrypt etc.
        services.AddInfrastructure(Configuration);

        // Înlocuim ICurrentUser real (bazat pe HttpContext) cu mock-ul nostru
        services.RemoveAll<ICurrentUser>();
        services.AddSingleton<ICurrentUser>(new MockCurrentUser(TestClinicId, TestUserId));

        // MediatR cu toate handler-ele din Application
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(
                typeof(ValyanClinic.Application.Common.Models.Result<>).Assembly));

        // FluentValidation (fără pipeline-behavior — la fel ca în producție)
        services.AddValidatorsFromAssembly(
            typeof(ValyanClinic.Application.Common.Models.Result<>).Assembly);

        return services.BuildServiceProvider();
    }

    private async Task<Guid> ResolveFirstClinicIdAsync()
    {
        await using var conn = new SqlConnection(ConnectionString);
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT TOP 1 Id FROM dbo.Clinics WHERE IsActive = 1 ORDER BY Name";
        var result = await cmd.ExecuteScalarAsync();
        return result is Guid g ? g : Guid.Empty;
    }
}
