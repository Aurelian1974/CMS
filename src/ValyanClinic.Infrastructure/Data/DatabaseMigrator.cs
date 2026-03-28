using DbUp;
using DbUp.Helpers;
using Microsoft.Extensions.Logging;

namespace ValyanClinic.Infrastructure.Data;

/// <summary>
/// Orchestrează rularea DbUp în două faze:
///   Faza 1 — Scripturi de migrare (tabele, indecși, seed) — rulate o singură dată,
///             tracked în tabelul SchemaVersions.
///   Faza 2 — Obiecte DB (Stored Procedures, Views, Functions, Triggers) — rulate
///             la fiecare execuție (NullJournal), astfel sunt mereu la zi.
///
/// Ordinea de execuție garantată: Migrations ÎNAINTE de Objects.
/// Nu rulează automat la pornirea aplicației — se invocă explicit via --migrate.
/// </summary>
public sealed class DatabaseMigrator
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseMigrator> _logger;

    public DatabaseMigrator(string connectionString, ILogger<DatabaseMigrator> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    /// <summary>Rulează toate fazele în ordine. Returnează true dacă totul a reușit.</summary>
    public bool Run()
    {
        _logger.LogInformation("DbUp — verificare/creare bază de date...");
        EnsureDatabase.For.SqlDatabase(_connectionString);

        _logger.LogInformation("=== Faza 1: Migrări schema (tabele, indecși, seed) ===");
        if (!RunPhase(
                phaseName: "Migrations",
                scriptFilter: s => s.Contains(".Scripts.Migrations."),
                useNullJournal: false))
            return false;

        _logger.LogInformation("=== Faza 2: Obiecte DB (Stored Procedures, Views, Functions) ===");
        if (!RunPhase(
                phaseName: "Objects",
                scriptFilter: s => s.Contains(".Scripts.StoredProcedures."),
                useNullJournal: true))
            return false;

        _logger.LogInformation("DbUp — toate fazele au fost finalizate cu succes.");
        return true;
    }

    private bool RunPhase(string phaseName, Func<string, bool> scriptFilter, bool useNullJournal)
    {
        var builder = DeployChanges.To
            .SqlDatabase(_connectionString)
            .WithScriptsEmbeddedInAssembly(typeof(DatabaseMigrator).Assembly, scriptFilter)
            .WithTransactionPerScript()
            .LogToConsole();

        if (useNullJournal)
            builder = builder.JournalTo(new NullJournal());

        var upgrader = builder.Build();

        // Afișare scripturi pending (doar pentru fazele tracked)
        if (!useNullJournal)
        {
            var pending = upgrader.GetScriptsToExecute();
            if (pending.Count == 0)
            {
                _logger.LogInformation("[{Phase}] Niciun script pending — baza de date este la zi.", phaseName);
                return true;
            }

            _logger.LogInformation("[{Phase}] {Count} script(uri) pending:", phaseName, pending.Count);
            foreach (var script in pending)
                _logger.LogInformation("  + {Script}", script.Name);
        }

        var result = upgrader.PerformUpgrade();

        if (result.Successful)
            _logger.LogInformation("[{Phase}] Finalizat cu succes.", phaseName);
        else
            _logger.LogError(result.Error, "[{Phase}] EȘUAT: {Error}", phaseName, result.Error?.Message);

        return result.Successful;
    }
}
