using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using ValyanClinic.FiscalBridge.Journal;
using ValyanClinic.FiscalBridge.Printing;

namespace ValyanClinic.FiscalBridge.Services;

/// <summary>
/// Mașina de stări a tipăririi pe PC-ul local:
/// <list type="number">
/// <item>jobul se caută în jurnal — tipărit ⇒ se întoarce rezultatul salvat; în curs / necunoscut ⇒
///   <see cref="PrintOutcome.Unknown"/> (reconciliere), fără nicio comandă către aparat;</item>
/// <item>se interoghează starea aparatului (hârtie, capac, bon deschis) — orice problemă ⇒ Failed, nimic trimis;</item>
/// <item>se scrie „Printing" în jurnal, apoi se tipărește; rezultatul se salvează.</item>
/// </list>
/// Un singur bon la un moment dat — aparatul nu acceptă comenzi intercalate.
/// </summary>
public sealed class ReceiptPrintService(IFiscalPrinter printer, ReceiptJournal journal, ILogger<ReceiptPrintService> logger)
{
    private readonly SemaphoreSlim _gate = new(1, 1);

    public Task<DeviceStatus> GetStatusAsync(CancellationToken ct) => WithGateAsync(() => printer.GetStatusAsync(ct), ct);

    public JournalEntry? GetJob(Guid jobId) => journal.Get(jobId);

    public Task<bool> CancelOpenReceiptAsync(CancellationToken ct) =>
        WithGateAsync(() => printer.CancelOpenReceiptAsync(CancellationToken.None), ct);

    public async Task<PrintAttempt> PrintAsync(ReceiptJob job, CancellationToken ct)
    {
        var invalid = Validate(job);
        if (invalid is not null) return PrintAttempt.Invalid(invalid);

        var hash = ComputeHash(job);
        await _gate.WaitAsync(ct);
        try
        {
            var existing = journal.Get(job.JobId);
            if (existing is not null)
            {
                if (existing.PayloadHash != hash)
                    return PrintAttempt.Conflict("Bonul a fost deja trimis cu alt conținut. Nu se retipărește.");

                switch (existing.State)
                {
                    case JournalState.Printed:
                        return PrintAttempt.Done(new PrintResult
                        {
                            Outcome = PrintOutcome.Printed,
                            ReceiptNumber = existing.ReceiptNumber,
                            DeviceSerialNumber = existing.DeviceSerialNumber,
                            PrintedAt = existing.PrintedAt,
                            DeviceResponse = existing.DeviceResponse,
                            IsReplay = true,
                        });
                    case JournalState.Printing:
                    case JournalState.Unknown:
                        return PrintAttempt.Done(PrintResult.Unknown(
                            "O tipărire anterioară a acestui bon nu s-a încheiat cu un rezultat sigur. " +
                            "Verificați pe casa de marcat și faceți reconcilierea — bonul nu se retipărește automat."));
                    // Failed = sigur netipărit → se poate reîncerca
                }
            }

            // Starea aparatului se citește ÎNAINTE de orice comandă fiscală
            var status = await printer.GetStatusAsync(ct);
            if (!status.IsReady)
            {
                var reason = string.Join(" ", status.Problems);
                journal.Save(job.JobId, hash, JournalState.Failed, u => u.ErrorMessage = reason);
                return PrintAttempt.Done(PrintResult.Failed(reason, status.RawStatus));
            }

            journal.Save(job.JobId, hash, JournalState.Printing);

            PrintResult result;
            try
            {
                // Din acest punct cererea browserului nu mai poate anula tipărirea la jumătate
                result = await printer.PrintReceiptAsync(job, CancellationToken.None);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Eroare neașteptată la tipărirea bonului {JobId}", job.JobId);
                result = PrintResult.Unknown($"Eroare neașteptată în timpul tipăririi: {ex.Message}");
            }

            journal.Save(job.JobId, hash, ToState(result.Outcome), u =>
            {
                u.ReceiptNumber = result.ReceiptNumber;
                u.DeviceSerialNumber = result.DeviceSerialNumber;
                u.PrintedAt = result.PrintedAt;
                u.ErrorMessage = result.ErrorMessage;
                u.DeviceResponse = result.DeviceResponse;
            });

            logger.LogInformation("Bonul {JobId}: {Outcome} {ReceiptNumber}", job.JobId, result.Outcome, result.ReceiptNumber);
            return PrintAttempt.Done(result);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<T> WithGateAsync<T>(Func<Task<T>> action, CancellationToken ct)
    {
        await _gate.WaitAsync(ct);
        try { return await action(); }
        finally { _gate.Release(); }
    }

    private static JournalState ToState(PrintOutcome outcome) => outcome switch
    {
        PrintOutcome.Printed => JournalState.Printed,
        PrintOutcome.Failed  => JournalState.Failed,
        _                    => JournalState.Unknown,
    };

    private static string? Validate(ReceiptJob job)
    {
        if (job.JobId == Guid.Empty) return "Identificatorul bonului lipsește.";
        if (job.Lines.Count == 0) return "Bonul nu are articole.";
        if (job.Tenders.Count == 0) return "Bonul nu are plăți.";
        if (job.Lines.Any(l => string.IsNullOrWhiteSpace(l.Name) || l.Quantity <= 0 || l.UnitPrice < 0))
            return "Un articol are denumire, cantitate sau preț invalid.";
        if (job.Lines.Any(l => string.IsNullOrWhiteSpace(l.TaxGroup)))
            return "Un articol nu are grupă TVA a aparatului (mapare lipsă în Setări financiare).";
        if (job.Tenders.Any(t => string.IsNullOrWhiteSpace(t.PaymentCode) || t.Amount <= 0))
            return "O plată nu are tip de plată al aparatului sau are sumă invalidă.";
        if (job.Tenders.Sum(t => t.Amount) != job.Total)
            return "Suma plăților diferă de totalul bonului.";
        return null;
    }

    private static string ComputeHash(ReceiptJob job)
    {
        var inv = CultureInfo.InvariantCulture;
        var sb = new StringBuilder();
        foreach (var l in job.Lines)
            sb.Append(inv, $"L|{l.Name}|{l.UnitPrice:0.00}|{l.Quantity:0.000}|{l.TaxGroup}\n");
        foreach (var t in job.Tenders)
            sb.Append(inv, $"T|{t.PaymentCode}|{t.Amount:0.00}\n");
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(sb.ToString())));
    }
}
