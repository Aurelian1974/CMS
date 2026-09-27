namespace ValyanClinic.FiscalBridge.Printing.Mock;

/// <summary>
/// Casă de marcat simulată — pentru dezvoltare fără aparat și pentru teste. Nu emite nimic fiscal.
/// Numerele de bon sunt locale procesului și încep de la 1.
/// </summary>
public sealed class MockFiscalPrinter(MockScenario scenario = MockScenario.None) : IFiscalPrinter
{
    public const string SerialNumber = "MOCK0000001";

    private readonly Lock _lock = new();
    private int _lastReceiptNumber;
    private bool _receiptOpen;

    public MockScenario Scenario { get; set; } = scenario;

    /// <summary>Câte bonuri au fost efectiv „emise" — testele verifică că nu se dublează.</summary>
    public int PrintedCount { get; private set; }

    public Task<DeviceStatus> GetStatusAsync(CancellationToken ct)
    {
        lock (_lock)
        {
            if (Scenario == MockScenario.Offline)
                return Task.FromResult(DeviceStatus.Offline("Casa de marcat nu răspunde (simulare)."));

            var problems = new List<string>();
            if (Scenario == MockScenario.PaperOut) problems.Add("Lipsă hârtie.");
            if (Scenario == MockScenario.CoverOpen) problems.Add("Capacul imprimantei este deschis.");
            if (_receiptOpen) problems.Add("Există un bon fiscal deschis pe aparat.");

            return Task.FromResult(new DeviceStatus
            {
                IsConnected = true,
                PaperOut = Scenario == MockScenario.PaperOut,
                CoverOpen = Scenario == MockScenario.CoverOpen,
                FiscalReceiptOpen = _receiptOpen,
                SerialNumber = SerialNumber,
                Model = "Mock",
                Problems = problems,
            });
        }
    }

    public Task<PrintResult> PrintReceiptAsync(ReceiptJob job, CancellationToken ct)
    {
        lock (_lock)
        {
            switch (Scenario)
            {
                case MockScenario.Offline:
                    return Task.FromResult(PrintResult.Failed("Casa de marcat nu răspunde (simulare)."));
                case MockScenario.PaperOut:
                case MockScenario.CoverOpen:
                    return Task.FromResult(PrintResult.Failed("Aparatul nu este pregătit (simulare)."));
                case MockScenario.DeviceErrorOnSale:
                    // Bonul deschis se anulează imediat — nimic fiscal nu rămâne emis
                    return Task.FromResult(PrintResult.Failed("Aparatul a refuzat articolul; bonul a fost anulat (simulare)."));
                case MockScenario.TimeoutAfterClose:
                    _lastReceiptNumber++;
                    PrintedCount++;
                    return Task.FromResult(PrintResult.Unknown(
                        "Conexiunea s-a pierdut după comanda de închidere a bonului (simulare)."));
            }

            _lastReceiptNumber++;
            PrintedCount++;
            return Task.FromResult(new PrintResult
            {
                Outcome = PrintOutcome.Printed,
                ReceiptNumber = _lastReceiptNumber.ToString(System.Globalization.CultureInfo.InvariantCulture),
                DeviceSerialNumber = SerialNumber,
                PrintedAt = DateTime.Now,
                DeviceResponse = $"MOCK total={job.Total:0.00}",
            });
        }
    }

    public Task<bool> CancelOpenReceiptAsync(CancellationToken ct)
    {
        lock (_lock)
        {
            var wasOpen = _receiptOpen;
            _receiptOpen = false;
            return Task.FromResult(wasOpen);
        }
    }

    /// <summary>Simulează un bon rămas deschis (ex: aparat oprit în timpul tipăririi).</summary>
    public void SimulateOpenReceipt()
    {
        lock (_lock) _receiptOpen = true;
    }
}
