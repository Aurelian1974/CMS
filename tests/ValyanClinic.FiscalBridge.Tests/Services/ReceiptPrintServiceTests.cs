using Microsoft.Extensions.Logging.Abstractions;
using ValyanClinic.FiscalBridge.Journal;
using ValyanClinic.FiscalBridge.Printing;
using ValyanClinic.FiscalBridge.Printing.Mock;
using ValyanClinic.FiscalBridge.Services;

namespace ValyanClinic.FiscalBridge.Tests.Services;

public sealed class ReceiptPrintServiceTests : IDisposable
{
    private static readonly Guid JobId = Guid.Parse("C2000001-0000-0000-0000-000000000001");

    private readonly string _dir = Path.Combine(Path.GetTempPath(), "vc-bridge-tests", Guid.NewGuid().ToString("N"));
    private readonly MockFiscalPrinter _printer = new();
    private readonly ReceiptJournal _journal;
    private readonly ReceiptPrintService _service;

    public ReceiptPrintServiceTests()
    {
        _journal = new ReceiptJournal(_dir, TimeProvider.System);
        _service = new ReceiptPrintService(_printer, _journal, NullLogger<ReceiptPrintService>.Instance);
    }

    public void Dispose()
    {
        if (Directory.Exists(_dir)) Directory.Delete(_dir, recursive: true);
    }

    // 100 + 50 = 150, plătit numerar 100 + card 50
    private static ReceiptJob Job(Guid? id = null, decimal cash = 100m) => new(
        id ?? JobId,
        [new ReceiptLine("Consultatie", 100m, 1m, "A"), new ReceiptLine("Spirometrie", 50m, 1m, "A")],
        [new ReceiptTender("P", cash), new ReceiptTender("N", 150m - cash)]);

    [Fact]
    public async Task Print_DeviceReady_PrintsAndRecordsInJournal()
    {
        var attempt = await _service.PrintAsync(Job(), default);

        Assert.Equal(PrintOutcome.Printed, attempt.Result!.Outcome);
        Assert.Equal("1", attempt.Result.ReceiptNumber);
        Assert.Equal(JournalState.Printed, _journal.Get(JobId)!.State);
        Assert.Equal(1, _printer.PrintedCount);
    }

    [Fact]
    public async Task Print_SameJobTwice_PrintsOnce_AndReplaysTheSavedResult()
    {
        await _service.PrintAsync(Job(), default);
        var second = await _service.PrintAsync(Job(), default);

        Assert.Equal(1, _printer.PrintedCount);
        Assert.True(second.Result!.IsReplay);
        Assert.Equal("1", second.Result.ReceiptNumber);
    }

    [Fact]
    public async Task Print_SameJobWithDifferentContent_IsRejectedAsConflict()
    {
        await _service.PrintAsync(Job(), default);

        var attempt = await _service.PrintAsync(Job(cash: 120m), default);

        Assert.True(attempt.IsConflict);
        Assert.Equal(1, _printer.PrintedCount);
    }

    [Theory]
    [InlineData(MockScenario.PaperOut)]
    [InlineData(MockScenario.CoverOpen)]
    [InlineData(MockScenario.Offline)]
    public async Task Print_DeviceNotReady_FailsWithoutPrinting(MockScenario scenario)
    {
        _printer.Scenario = scenario;

        var attempt = await _service.PrintAsync(Job(), default);

        Assert.Equal(PrintOutcome.Failed, attempt.Result!.Outcome);
        Assert.Equal(0, _printer.PrintedCount);
        Assert.Equal(JournalState.Failed, _journal.Get(JobId)!.State);
    }

    [Fact]
    public async Task Print_AfterFailure_CanBeRetried_AndPrintsOnce()
    {
        _printer.Scenario = MockScenario.PaperOut;
        await _service.PrintAsync(Job(), default);

        _printer.Scenario = MockScenario.None;
        var retry = await _service.PrintAsync(Job(), default);

        Assert.Equal(PrintOutcome.Printed, retry.Result!.Outcome);
        Assert.Equal(1, _printer.PrintedCount);
    }

    [Fact]
    public async Task Print_UnknownOutcome_IsNeverRetriedAutomatically()
    {
        _printer.Scenario = MockScenario.TimeoutAfterClose;
        var first = await _service.PrintAsync(Job(), default);

        _printer.Scenario = MockScenario.None;
        var retry = await _service.PrintAsync(Job(), default);

        Assert.Equal(PrintOutcome.Unknown, first.Result!.Outcome);
        Assert.Equal(PrintOutcome.Unknown, retry.Result!.Outcome);
        Assert.Equal(1, _printer.PrintedCount);
    }

    [Fact]
    public async Task Print_JobLeftInPrintingAfterCrash_IsReportedUnknown_WithoutTouchingTheDevice()
    {
        await _service.PrintAsync(Job(), default);          // doar pentru hash-ul corect din jurnal
        var hash = _journal.Get(JobId)!.PayloadHash;
        _journal.Save(JobId, hash, JournalState.Printing);  // procesul „a căzut" în timpul tipăririi

        var attempt = await _service.PrintAsync(Job(), default);

        Assert.Equal(PrintOutcome.Unknown, attempt.Result!.Outcome);
        Assert.Equal(1, _printer.PrintedCount);
    }

    [Fact]
    public async Task Print_ReceiptLeftOpenOnDevice_FailsWithoutPrinting()
    {
        _printer.SimulateOpenReceipt();

        var attempt = await _service.PrintAsync(Job(), default);

        Assert.Equal(PrintOutcome.Failed, attempt.Result!.Outcome);
        Assert.Contains("bon fiscal deschis", attempt.Result.ErrorMessage);
        Assert.Equal(0, _printer.PrintedCount);
    }

    [Fact]
    public async Task Print_DeviceErrorOnSale_ReportsFailed_AndAllowsRetry()
    {
        _printer.Scenario = MockScenario.DeviceErrorOnSale;
        var first = await _service.PrintAsync(Job(), default);

        _printer.Scenario = MockScenario.None;
        var retry = await _service.PrintAsync(Job(), default);

        Assert.Equal(PrintOutcome.Failed, first.Result!.Outcome);
        Assert.Equal(PrintOutcome.Printed, retry.Result!.Outcome);
        Assert.Equal(2, _journal.Get(JobId)!.Attempts);
    }

    [Fact]
    public async Task Print_TendersNotMatchingTotal_IsRejectedBeforeReachingTheDevice()
    {
        var job = Job() with { Tenders = [new ReceiptTender("P", 100m)] };

        var attempt = await _service.PrintAsync(job, default);

        Assert.Null(attempt.Result);
        Assert.NotNull(attempt.RejectionReason);
        Assert.Null(_journal.Get(JobId));
    }

    [Fact]
    public async Task Print_LineWithoutTaxGroup_IsRejected()
    {
        var job = Job() with { Lines = [new ReceiptLine("Consultatie", 150m, 1m, "")] };

        var attempt = await _service.PrintAsync(job, default);

        Assert.Contains("grupă TVA", attempt.RejectionReason);
    }

    [Fact]
    public async Task Print_PrinterThrows_IsRecordedAsUnknown()
    {
        var service = new ReceiptPrintService(new ThrowingPrinter(), _journal, NullLogger<ReceiptPrintService>.Instance);

        var attempt = await service.PrintAsync(Job(), default);

        Assert.Equal(PrintOutcome.Unknown, attempt.Result!.Outcome);
        Assert.Equal(JournalState.Unknown, _journal.Get(JobId)!.State);
    }

    [Fact]
    public async Task Journal_SurvivesProcessRestart()
    {
        await _service.PrintAsync(Job(), default);

        var reopened = new ReceiptJournal(_dir, TimeProvider.System);

        Assert.Equal("1", reopened.Get(JobId)!.ReceiptNumber);
    }

    private sealed class ThrowingPrinter : IFiscalPrinter
    {
        public Task<DeviceStatus> GetStatusAsync(CancellationToken ct) =>
            Task.FromResult(new DeviceStatus { IsConnected = true });

        public Task<PrintResult> PrintReceiptAsync(ReceiptJob job, CancellationToken ct) =>
            throw new InvalidOperationException("port închis brusc");

        public Task<bool> CancelOpenReceiptAsync(CancellationToken ct) => Task.FromResult(false);
    }
}
