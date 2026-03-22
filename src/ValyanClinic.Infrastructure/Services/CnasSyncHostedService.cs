using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Configuration;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Serviciu background care declanșează automat sincronizarea nomenclatoarelor CNAS
/// în ziua configurată din fiecare lună (implicit 2 ale lunii, ora 08:00 UTC).
/// </summary>
public sealed class CnasSyncHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<CnasOptions> options,
    ILogger<CnasSyncHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("CNAS sync hosted service pornit.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = ComputeNextDelay();
            logger.LogInformation("Următoarea sincronizare CNAS automată în {Delay:g}.", delay);

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await TriggerSyncAsync(stoppingToken);
        }

        logger.LogInformation("CNAS sync hosted service oprit.");
    }

    private TimeSpan ComputeNextDelay()
    {
        var opts = options.Value;
        var now  = DateTime.UtcNow;

        // Următoarea apariție a zilei configurate (ex: 2) la ora configurată (ex: 08:00)
        var candidate = new DateTime(now.Year, now.Month, 1, opts.SyncHour, 0, 0, DateTimeKind.Utc)
            .AddDays(opts.SyncDayOfMonth - 1);

        if (candidate <= now)
            candidate = candidate.AddMonths(1);

        return candidate - now;
    }

    private async Task TriggerSyncAsync(CancellationToken ct)
    {
        logger.LogInformation("Declanșare sincronizare CNAS automată...");
        try
        {
            using var scope  = scopeFactory.CreateScope();
            var syncService  = scope.ServiceProvider.GetRequiredService<ICnasNomenclatorService>();
            var jobId        = await syncService.StartSyncAsync("scheduled:monthly", ct);
            logger.LogInformation("Sincronizare CNAS automată inițiată. JobId={JobId}", jobId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Eroare la inițierea sincronizării CNAS automate.");
        }
    }
}
