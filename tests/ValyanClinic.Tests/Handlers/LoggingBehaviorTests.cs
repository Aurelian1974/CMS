using MediatR;
using Microsoft.Extensions.Logging;
using ValyanClinic.Application.Common.Behaviors;
using ValyanClinic.Application.Common.Models;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

// Must be public so the generic ILogger<LoggingBehavior<TestQuery,…>> proxy is accessible
public sealed record TestQuery : IRequest<Result<string>>;

/// <summary>
/// Logger de test care capturează ce nivel a fost folosit și excepția transmisă.
/// </summary>
internal sealed class CapturingLogger : ILogger<LoggingBehavior<TestQuery, Result<string>>>
{
    public readonly List<(LogLevel Level, Exception? Exception)> Entries = [];

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => true;

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
        => Entries.Add((logLevel, exception));
}

public sealed class LoggingBehaviorTests
{
    private readonly CapturingLogger _logger = new();

    private LoggingBehavior<TestQuery, Result<string>> CreateBehavior() =>
        new(_logger);

    // ── happy path ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_SuccessfulRequest_ReturnsResponseFromNext()
    {
        var expected = Result<string>.Success("ok");
        RequestHandlerDelegate<Result<string>> next = _ => Task.FromResult(expected);

        var result = await CreateBehavior().Handle(new TestQuery(), next, default);

        Assert.Equal(expected, result);
    }

    [Fact]
    public async Task Handle_SuccessfulRequest_LogsInformation()
    {
        RequestHandlerDelegate<Result<string>> next =
            _ => Task.FromResult(Result<string>.Success("ok"));

        await CreateBehavior().Handle(new TestQuery(), next, default);

        Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Information);
    }

    // ── exception path ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_HandlerThrows_ExceptionPropagates()
    {
        var boom = new InvalidOperationException("boom");
        RequestHandlerDelegate<Result<string>> next = _ => throw boom;

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => CreateBehavior().Handle(new TestQuery(), next, default));

        Assert.Same(boom, ex);
    }

    [Fact]
    public async Task Handle_HandlerThrows_LogsError()
    {
        var boom = new InvalidOperationException("boom");
        RequestHandlerDelegate<Result<string>> next = _ => throw boom;

        try { await CreateBehavior().Handle(new TestQuery(), next, default); }
        catch { /* expected */ }

        Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Error && e.Exception == boom);
    }

    // ── cancellation ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_CancellationRequested_PropagatesCancellation()
    {
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        RequestHandlerDelegate<Result<string>> next = ct =>
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult(Result<string>.Success("ok"));
        };

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => CreateBehavior().Handle(new TestQuery(), next, cts.Token));
    }
}
