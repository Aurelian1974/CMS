using System.Text;
using Microsoft.Extensions.Options;
using ValyanClinic.FiscalBridge.Configuration;
using ValyanClinic.FiscalBridge.Printing;
using ValyanClinic.FiscalBridge.Printing.Datecs;
using ValyanClinic.FiscalBridge.Printing.Mock;
using ValyanClinic.FiscalBridge.Security;

namespace ValyanClinic.FiscalBridge.Services;

/// <summary>Construiește driverul de casă de marcat din configurație.</summary>
public static class FiscalPrinterFactory
{
    public static IFiscalPrinter Create(IServiceProvider sp)
    {
        var options = sp.GetRequiredService<IOptions<PrinterOptions>>().Value;
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(FiscalPrinterFactory));

        if (string.Equals(options.Driver, PrinterDrivers.Mock, StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning("Fiscal bridge rulează cu casa de marcat SIMULATĂ — nu se emit bonuri fiscale reale.");
            return new MockFiscalPrinter(Enum.TryParse<MockScenario>(options.MockScenario, true, out var s) ? s : MockScenario.None);
        }

        if (!string.Equals(options.Driver, PrinterDrivers.Datecs, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Driver necunoscut: {options.Driver}. Valori permise: Mock, Datecs.");

        IDatecsTransport transport = string.Equals(options.Transport, PrinterTransports.Tcp, StringComparison.OrdinalIgnoreCase)
            ? new TcpDatecsTransport(options.Host, options.TcpPort)
            : new SerialDatecsTransport(options.PortName, options.BaudRate);

        var client = new DatecsProtocolClient(
            transport,
            Encoding.GetEncoding(options.TextEncoding),
            options.ResponseTimeoutMs,
            options.BusyTimeoutMs,
            options.MaxNakRetries);

        var password = sp.GetRequiredService<ISecretStore>().GetOperatorPassword();
        if (string.IsNullOrEmpty(password))
            logger.LogWarning("Parola operatorului nu este setată (rulați cu --set-operator-password). Bonurile vor fi refuzate de aparat.");

        return new DatecsFiscalPrinter(client, options, password ?? string.Empty);
    }
}
