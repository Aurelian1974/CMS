using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Configuration;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Serviciu background care declanșează automat sincronizarea nomenclatorului ANM
/// în ziua configurată din fiecare lună (implicit 5 ale lunii, ora 06:00 UTC).
/// </summary>
public sealed class AnmSyncHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<AnmOptions> options,
    ILogger<AnmSyncHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ANM sync hosted service pornit.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = ComputeNextDelay();
            logger.LogInformation("Următoarea sincronizare ANM automată în {Delay:g}.", delay);

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

        logger.LogInformation("ANM sync hosted service oprit.");
    }

    private TimeSpan ComputeNextDelay()
    {
        var opts = options.Value;
        var now  = DateTime.UtcNow;

        var candidate = new DateTime(now.Year, now.Month, 1, opts.SyncHour, 0, 0, DateTimeKind.Utc)
            .AddDays(opts.SyncDayOfMonth - 1);

        if (candidate <= now)
            candidate = candidate.AddMonths(1);

        return candidate - now;
    }

    private async Task TriggerSyncAsync(CancellationToken ct)
    {
        logger.LogInformation("Declanșare sincronizare ANM automată...");
        try
        {
            using var scope = scopeFactory.CreateScope();
            var syncService = scope.ServiceProvider.GetRequiredService<IAnmNomenclatorService>();
            var jobId       = await syncService.StartSyncAsync("scheduled:monthly", ct);
            logger.LogInformation("Sincronizare ANM automată inițiată. JobId={JobId}", jobId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Eroare la inițierea sincronizării ANM automate.");
        }
    }
}
