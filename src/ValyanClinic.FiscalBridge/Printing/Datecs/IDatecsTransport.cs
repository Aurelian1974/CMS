namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>Canalul fizic către aparat (COM / USB-COM sau TCP). Un singur apelant la un moment dat.</summary>
public interface IDatecsTransport : IDisposable
{
    void EnsureOpen();

    Task WriteAsync(byte[] data, CancellationToken ct);

    /// <summary>Citește un octet; -1 dacă nu vine nimic în <paramref name="timeoutMs"/>.</summary>
    Task<int> ReadByteAsync(int timeoutMs, CancellationToken ct);

    /// <summary>Golește octeții rămași de la un răspuns anterior (ex: SYN întârziat).</summary>
    void DiscardInput();
}
