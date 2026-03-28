using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ValyanClinic.Application.Common.Behaviors;

/// <summary>
/// Pipeline behavior MediatR care loghează automat fiecare command/query
/// cu durata de execuție. Emite warning pentru operații lente (> 500 ms).
/// </summary>
public sealed class LoggingBehavior<TRequest, TResponse>(
    ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private const int SlowRequestThresholdMs = 500;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;

        logger.LogDebug("Executing {RequestName}", requestName);

        var sw = Stopwatch.StartNew();
        try
        {
            var response = await next(cancellationToken);
            sw.Stop();

            if (sw.ElapsedMilliseconds >= SlowRequestThresholdMs)
            {
                logger.LogWarning(
                    "Slow request detected: {RequestName} completed in {ElapsedMs} ms",
                    requestName, sw.ElapsedMilliseconds);
            }
            else
            {
                logger.LogInformation(
                    "{RequestName} completed in {ElapsedMs} ms",
                    requestName, sw.ElapsedMilliseconds);
            }

            return response;
        }
        catch (Exception ex)
        {
            sw.Stop();
            logger.LogError(ex,
                "{RequestName} failed after {ElapsedMs} ms",
                requestName, sw.ElapsedMilliseconds);
            throw;
        }
    }
}
