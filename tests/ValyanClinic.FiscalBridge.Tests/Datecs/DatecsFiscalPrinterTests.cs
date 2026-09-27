using ValyanClinic.FiscalBridge.Configuration;
using ValyanClinic.FiscalBridge.Printing;
using ValyanClinic.FiscalBridge.Printing.Datecs;
using ValyanClinic.FiscalBridge.Tests.TestHelpers;

namespace ValyanClinic.FiscalBridge.Tests.Datecs;

public sealed class DatecsFiscalPrinterTests
{
    private readonly FakeDatecsDevice _device = new();

    private DatecsFiscalPrinter Printer() =>
        new(_device.CreateClient(), new PrinterOptions { OperatorCode = "1", TillNumber = "1", MaxItemNameLength = 20 }, "0000");

    private static ReceiptJob Job() => new(
        Guid.Parse("C1000001-0000-0000-0000-000000000001"),
        [new ReceiptLine("Consultatie, control\tpneumologie", 100m, 1m, "A")],
        [new ReceiptTender("P", 100m)]);

    [Fact]
    public async Task Print_HappyPath_SendsOpenSaleTotalClose_AndReturnsReceiptNumber()
    {
        var result = await Printer().PrintReceiptAsync(Job(), default);

        Assert.Equal(PrintOutcome.Printed, result.Outcome);
        Assert.Equal("42", result.ReceiptNumber);
        Assert.Equal(
            new[] { DatecsCommands.OpenFiscalReceipt, DatecsCommands.RegisterSale, DatecsCommands.Total, DatecsCommands.CloseFiscalReceipt },
            _device.SentCommands);
        Assert.Equal(1, _device.IssuedReceipts);
    }

    [Fact]
    public async Task Print_FormatsSaleAndPaymentWithInvariantDecimals()
    {
        await Printer().PrintReceiptAsync(Job(), default);

        var sale = _device.Transport.Requests.Single(r => r.Command == DatecsCommands.RegisterSale).Data;
        var total = _device.Transport.Requests.Single(r => r.Command == DatecsCommands.Total).Data;

        // Virgula și tab-ul din denumire sunt separatori de protocol → eliminate; denumirea trunchiată la 20
        Assert.Equal("Consultatie controlp\tA100.00*1.000", sale);
        Assert.Equal("\tP100.00", total);
    }

    [Fact]
    public async Task Print_DoesNotLogOperatorPassword()
    {
        var result = await Printer().PrintReceiptAsync(Job(), default);

        Assert.DoesNotContain("0000", result.DeviceResponse!.Split('\n')[0]);
    }

    [Fact]
    public async Task Print_DeviceRejectsSale_CancelsOpenReceipt_AndReportsFailed()
    {
        _device.RejectCommand = DatecsCommands.RegisterSale;

        var result = await Printer().PrintReceiptAsync(Job(), default);

        Assert.Equal(PrintOutcome.Failed, result.Outcome);
        Assert.Contains(DatecsCommands.CancelFiscalReceipt, _device.SentCommands);
        Assert.DoesNotContain(DatecsCommands.CloseFiscalReceipt, _device.SentCommands);
        Assert.False(_device.ReceiptOpen);
        Assert.Equal(0, _device.IssuedReceipts);
    }

    [Fact]
    public async Task Print_SilenceBeforeClose_QueriesDevice_CancelsOpenReceipt_AndReportsFailed()
    {
        _device.SilentCommand = DatecsCommands.RegisterSale;

        var result = await Printer().PrintReceiptAsync(Job(), default);

        Assert.Equal(PrintOutcome.Failed, result.Outcome);
        Assert.Contains(DatecsCommands.Status, _device.SentCommands);
        Assert.Contains(DatecsCommands.CancelFiscalReceipt, _device.SentCommands);
        Assert.Equal(0, _device.IssuedReceipts);
    }

    [Fact]
    public async Task Print_SilenceOnOpen_ReceiptOpenedOnDevice_IsCancelled_AndReportsFailed()
    {
        // Aparatul execută deschiderea dar răspunsul se pierde; la verificare, bonul e deschis → anulare
        _device.SilentCommand = DatecsCommands.OpenFiscalReceipt;

        var result = await Printer().PrintReceiptAsync(Job(), default);

        Assert.Equal(PrintOutcome.Failed, result.Outcome);
        Assert.Contains(DatecsCommands.CancelFiscalReceipt, _device.SentCommands);
        Assert.False(_device.ReceiptOpen);
    }

    [Fact]
    public async Task Print_SilenceAfterClose_ReportsUnknown_AndNeverRetriesOrCancels()
    {
        _device.SilentCommand = DatecsCommands.CloseFiscalReceipt;

        var result = await Printer().PrintReceiptAsync(Job(), default);

        Assert.Equal(PrintOutcome.Unknown, result.Outcome);
        Assert.Single(_device.SentCommands, c => c == DatecsCommands.CloseFiscalReceipt);
        Assert.DoesNotContain(DatecsCommands.CancelFiscalReceipt, _device.SentCommands);
    }

    [Fact]
    public async Task Print_PaymentNotCoveringTotal_CancelsAndReportsFailed()
    {
        _device.PaidCode = "R";

        var result = await Printer().PrintReceiptAsync(Job(), default);

        Assert.Equal(PrintOutcome.Failed, result.Outcome);
        Assert.DoesNotContain(DatecsCommands.CloseFiscalReceipt, _device.SentCommands);
        Assert.False(_device.ReceiptOpen);
    }

    [Fact]
    public async Task GetStatus_ReadsSerialNumberFromDiagnosticInfo()
    {
        var status = await Printer().GetStatusAsync(default);

        Assert.True(status.IsReady);
        Assert.Equal("DT123456", status.SerialNumber);
    }

    [Fact]
    public async Task GetStatus_Silence_ReportsOffline()
    {
        _device.SilentCommand = DatecsCommands.Status;

        var status = await Printer().GetStatusAsync(default);

        Assert.False(status.IsConnected);
        Assert.False(status.IsReady);
    }
}
