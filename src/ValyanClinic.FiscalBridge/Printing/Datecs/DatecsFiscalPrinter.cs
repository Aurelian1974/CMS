using System.Globalization;
using System.Text;
using ValyanClinic.FiscalBridge.Configuration;

namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>
/// Casă de marcat Datecs, protocol clasic (DP-25 / DP-05 / FP-550). Toată secvența de comenzi
/// și formatul parametrilor sunt NEVERIFICATE PE APARAT — se validează pe casa de marcat reală
/// (mod de test / service) înainte de producție.
/// <para>
/// Clasificarea rezultatului e partea critică: înainte de trimiterea comenzii de închidere,
/// orice eșec se poate repara anulând bonul deschis (un bon neînchis nu e document fiscal) →
/// <see cref="PrintOutcome.Failed"/>. După trimiterea închiderii, fără confirmare →
/// <see cref="PrintOutcome.Unknown"/>, niciodată retipărire.
/// </para>
/// </summary>
public sealed class DatecsFiscalPrinter(DatecsProtocolClient client, PrinterOptions options, string operatorPassword)
    : IFiscalPrinter
{
    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;
    private string? _serialNumber;

    public async Task<DeviceStatus> GetStatusAsync(CancellationToken ct)
    {
        try
        {
            var status = (await client.SendAsync(DatecsCommands.Status, string.Empty, ct)).Status;
            _serialNumber ??= await ReadSerialNumberAsync(ct);

            var problems = new List<string>();
            if (status.PaperOut) problems.Add("Lipsă hârtie.");
            if (status.CoverOpen) problems.Add("Capacul imprimantei este deschis.");
            if (status.PrinterFailure) problems.Add("Defect al mecanismului de tipărire.");
            if (status.FiscalMemoryFull) problems.Add("Memoria fiscală este plină.");
            if (status.FiscalReceiptOpen) problems.Add("Există un bon fiscal deschis pe aparat.");
            if (status.NonFiscalReceiptOpen) problems.Add("Există un bon nefiscal deschis pe aparat.");

            return new DeviceStatus
            {
                IsConnected = true,
                PaperOut = status.PaperOut,
                CoverOpen = status.CoverOpen,
                PrinterFailure = status.PrinterFailure,
                FiscalReceiptOpen = status.FiscalReceiptOpen,
                NonFiscalReceiptOpen = status.NonFiscalReceiptOpen,
                SerialNumber = _serialNumber,
                Model = "Datecs",
                RawStatus = status.ToString(),
                Problems = problems,
            };
        }
        catch (DatecsCommunicationException ex)
        {
            return DeviceStatus.Offline(ex.Message);
        }
        catch (DatecsDeviceException ex)
        {
            return new DeviceStatus { IsConnected = true, RawStatus = ex.Status.ToString(), Problems = ex.Status.Describe() };
        }
    }

    public async Task<PrintResult> PrintReceiptAsync(ReceiptJob job, CancellationToken ct)
    {
        var log = new StringBuilder();
        var closeSent = false;

        try
        {
            // NEVERIFICAT PE APARAT — „<OpCode>,<OpPwd>,<TillNmb>"
            await SendLoggedAsync(DatecsCommands.OpenFiscalReceipt,
                $"{options.OperatorCode},{operatorPassword},{options.TillNumber}", log, ct, mask: true);

            foreach (var line in job.Lines)
            {
                // NEVERIFICAT PE APARAT — „<Text><Tab><TaxGr><Price>*<Qty>"
                await SendLoggedAsync(DatecsCommands.RegisterSale,
                    $"{SanitizeName(line.Name)}\t{line.TaxGroup}{Money(line.UnitPrice)}*{Quantity(line.Quantity)}", log, ct);
            }

            string? paidCode = null;
            foreach (var tender in job.Tenders)
            {
                // NEVERIFICAT PE APARAT — „<Tab><PaidMode><Amount>" → „<PaidCode><Amount>"
                var response = await SendLoggedAsync(DatecsCommands.Total,
                    $"\t{tender.PaymentCode}{Money(tender.Amount)}", log, ct);
                var answer = client.Encoding.GetString(response.Data);
                paidCode = answer.Length > 0 ? answer[..1] : null;
            }

            // NEVERIFICAT PE APARAT — „D" = achitat integral; altceva = sumă insuficientă / eroare
            if (paidCode != "D")
                return await AbortAsync($"Plata nu acoperă totalul bonului (răspuns „{paidCode}\").", log, ct);

            closeSent = true;
            var closed = await SendLoggedAsync(DatecsCommands.CloseFiscalReceipt, string.Empty, log, ct);
            var fields = client.Fields(closed);

            return new PrintResult
            {
                Outcome = PrintOutcome.Printed,
                // NEVERIFICAT PE APARAT — al doilea câmp = numărul bonului fiscal
                ReceiptNumber = fields.Length > 1 ? fields[1].Trim() : fields[0].Trim(),
                DeviceSerialNumber = _serialNumber,
                PrintedAt = DateTime.Now,
                DeviceResponse = log.ToString(),
            };
        }
        catch (DatecsDeviceException ex) when (!closeSent)
        {
            return await AbortAsync(ex.Message, log, ct);
        }
        catch (DatecsCommunicationException ex) when (!closeSent)
        {
            // Nu știm ce comandă a ajuns — întrebăm aparatul dacă are un bon deschis
            return await AbortAfterCommunicationErrorAsync(ex.Message, log, ct);
        }
        catch (DatecsDeviceException ex)
        {
            // Închiderea a fost respinsă explicit: bonul e încă deschis → se poate anula
            return await AbortAsync(ex.Message, log, ct);
        }
        catch (DatecsCommunicationException ex)
        {
            return PrintResult.Unknown(
                $"Comanda de închidere a bonului a fost trimisă, dar aparatul nu a confirmat ({ex.Message}). " +
                "Verificați pe casa de marcat ultimul bon emis.", log.ToString());
        }
    }

    public async Task<bool> CancelOpenReceiptAsync(CancellationToken ct)
    {
        var status = await client.SendAsync(DatecsCommands.Status, string.Empty, ct);
        if (!status.Status.FiscalReceiptOpen) return false;
        await client.SendAsync(DatecsCommands.CancelFiscalReceipt, string.Empty, ct);
        return true;
    }

    // Eșec sigur înainte de închidere: anulăm bonul deschis; dacă nici anularea nu reușește, nu știm ce e pe aparat
    private async Task<PrintResult> AbortAsync(string reason, StringBuilder log, CancellationToken ct)
    {
        try
        {
            await SendLoggedAsync(DatecsCommands.CancelFiscalReceipt, string.Empty, log, ct);
            return PrintResult.Failed($"{reason} Bonul deschis a fost anulat pe aparat.", log.ToString());
        }
        catch (DatecsDeviceException)
        {
            // „Comandă nepermisă" la anulare = nu exista niciun bon deschis → nimic emis
            return await ConfirmNoOpenReceiptAsync(reason, log, ct);
        }
        catch (DatecsCommunicationException cex)
        {
            return PrintResult.Unknown($"{reason} Anularea bonului deschis nu a putut fi confirmată ({cex.Message}).", log.ToString());
        }
    }

    private async Task<PrintResult> AbortAfterCommunicationErrorAsync(string reason, StringBuilder log, CancellationToken ct)
    {
        try
        {
            var status = await client.SendAsync(DatecsCommands.Status, string.Empty, ct);
            log.AppendLine($"0x{DatecsCommands.Status:X2} → {status.Status}");
            return status.Status.FiscalReceiptOpen
                ? await AbortAsync(reason, log, ct)
                : PrintResult.Failed($"{reason} Aparatul nu are niciun bon deschis — nu s-a emis nimic.", log.ToString());
        }
        catch (Exception ex) when (ex is DatecsCommunicationException or DatecsDeviceException)
        {
            return PrintResult.Unknown($"{reason} Starea aparatului nu a putut fi verificată ({ex.Message}).", log.ToString());
        }
    }

    private async Task<PrintResult> ConfirmNoOpenReceiptAsync(string reason, StringBuilder log, CancellationToken ct)
    {
        try
        {
            var status = await client.SendAsync(DatecsCommands.Status, string.Empty, ct);
            return status.Status.FiscalReceiptOpen
                ? PrintResult.Unknown($"{reason} Bonul a rămas deschis și nu a putut fi anulat.", log.ToString())
                : PrintResult.Failed($"{reason} Nu s-a emis niciun bon.", log.ToString());
        }
        catch (Exception ex) when (ex is DatecsCommunicationException or DatecsDeviceException)
        {
            return PrintResult.Unknown($"{reason} Starea aparatului nu a putut fi verificată ({ex.Message}).", log.ToString());
        }
    }

    private async Task<DatecsResponse> SendLoggedAsync(byte command, string data, StringBuilder log, CancellationToken ct, bool mask = false)
    {
        try
        {
            var response = await client.SendAsync(command, data, ct);
            log.AppendLine($"0x{command:X2} {(mask ? "***" : data.Replace('\t', '|'))} → {client.Encoding.GetString(response.Data)} [{response.Status}]");
            return response;
        }
        catch (Exception ex) when (ex is DatecsCommunicationException or DatecsDeviceException)
        {
            log.AppendLine($"0x{command:X2} {(mask ? "***" : data.Replace('\t', '|'))} → EROARE: {ex.Message}");
            throw;
        }
    }

    private async Task<string?> ReadSerialNumberAsync(CancellationToken ct)
    {
        try
        {
            // NEVERIFICAT PE APARAT — al cincilea câmp din răspunsul la 90 = numărul de serie
            var fields = client.Fields(await client.SendAsync(DatecsCommands.DiagnosticInfo, string.Empty, ct));
            return fields.Length > 4 ? fields[4].Trim() : null;
        }
        catch (Exception ex) when (ex is DatecsCommunicationException or DatecsDeviceException)
        {
            return null;
        }
    }

    // Tab, LF și virgula sunt separatori de protocol
    private string SanitizeName(string name)
    {
        var clean = new string([.. name.Where(c => c >= ' ' && c != ',' && c != '\t')]).Trim();
        return clean.Length > options.MaxItemNameLength ? clean[..options.MaxItemNameLength] : clean;
    }

    private static string Money(decimal value) => value.ToString("0.00", Inv);

    private static string Quantity(decimal value) => value.ToString("0.000", Inv);
}
