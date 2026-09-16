using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Configuration;
using ValyanClinic.Application.Common.Interfaces;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Serviciu background care șterge zilnic datele de autentificare expirate:
/// refresh token-urile revocate sau expirate și evenimentele vechi din jurnalul
/// de securitate, fiecare cu perioada lui de retenție.
///
/// Fără el, RefreshTokens crește la infinit: fiecare rotație lasă în urmă un rând
/// revocat, iar rotația are loc la 15 minute pentru fiecare sesiune activă.
/// </summary>
public sealed class RefreshTokenCleanupHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<SecurityOptions> options,
    ILogger<RefreshTokenCleanupHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

    /// <summary>
    /// Întârziere la pornire — curățarea nu e urgentă și nu trebuie să concureze
    /// cu inițializarea aplicației.
    /// </summary>
    private static readonly TimeSpan StartupDelay = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Refresh token cleanup hosted service pornit.");

        var delay = StartupDelay;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await CleanupAsync(stoppingToken);
            delay = Interval;
        }

        logger.LogInformation("Refresh token cleanup hosted service oprit.");
    }

    private async Task CleanupAsync(CancellationToken ct)
    {
        var tokenRetention = options.Value.RefreshTokenRetentionDays;
        var eventRetention = options.Value.SecurityEventRetentionDays;

        try
        {
            using var scope = scopeFactory.CreateScope();
            var authRepository = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
            var securityLog    = scope.ServiceProvider.GetRequiredService<ISecurityEventLogger>();

            var deletedTokens = await authRepository.DeleteExpiredRefreshTokensAsync(tokenRetention, ct);
            if (deletedTokens > 0)
                logger.LogInformation(
                    "Curățare refresh tokens: {Deleted} rânduri șterse (retenție {Days} zile).",
                    deletedTokens, tokenRetention);

            var deletedEvents = await securityLog.DeleteOlderThanAsync(eventRetention, ct);
            if (deletedEvents > 0)
                logger.LogInformation(
                    "Curățare jurnal securitate: {Deleted} evenimente șterse (retenție {Days} zile).",
                    deletedEvents, eventRetention);
        }
        catch (Exception ex)
        {
            // Curățarea e un job de întreținere — un eșec nu trebuie să oprească serviciul.
            logger.LogError(ex, "Curățarea datelor de autentificare a eșuat.");
        }
    }
}
