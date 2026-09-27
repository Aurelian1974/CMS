namespace ValyanClinic.FiscalBridge.Printing;

/// <summary>
/// Abstracția casei de marcat. Implementările NU decid retry-uri: întorc un
/// <see cref="PrintResult"/> care spune precis dacă bonul s-a emis, sigur nu s-a emis sau nu se știe.
/// </summary>
public interface IFiscalPrinter
{
    Task<DeviceStatus> GetStatusAsync(CancellationToken ct);

    /// <summary>Tipărește bonul complet (deschidere, articole, plăți, închidere).</summary>
    Task<PrintResult> PrintReceiptAsync(ReceiptJob job, CancellationToken ct);

    /// <summary>Anulează un bon fiscal rămas deschis (neînchis = neemis). Întoarce false dacă nu era niciunul.</summary>
    Task<bool> CancelOpenReceiptAsync(CancellationToken ct);
}
