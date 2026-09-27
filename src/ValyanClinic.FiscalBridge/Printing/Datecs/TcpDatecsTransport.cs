using System.Net.Sockets;

namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>Transport TCP pentru modelele conectate în rețea. Același protocol de cadre ca pe serial.</summary>
public sealed class TcpDatecsTransport(string host, int port) : IDatecsTransport
{
    private TcpClient? _client;
    private NetworkStream? _stream;

    public void EnsureOpen()
    {
        if (_client is { Connected: true } && _stream is not null) return;

        _stream?.Dispose();
        _client?.Dispose();
        // NEVERIFICAT PE APARAT — portul TCP implicit depinde de model / programare
        _client = new TcpClient { NoDelay = true };
        _client.Connect(host, port);
        _stream = _client.GetStream();
    }

    public async Task WriteAsync(byte[] data, CancellationToken ct)
    {
        EnsureOpen();
        await _stream!.WriteAsync(data, ct);
        await _stream.FlushAsync(ct);
    }

    public async Task<int> ReadByteAsync(int timeoutMs, CancellationToken ct)
    {
        EnsureOpen();
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(timeoutMs);
        var buffer = new byte[1];
        try
        {
            var read = await _stream!.ReadAsync(buffer, timeout.Token);
            return read == 0 ? -1 : buffer[0];
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            return -1;
        }
    }

    public void DiscardInput()
    {
        if (_stream is null) return;
        var buffer = new byte[256];
        while (_stream.DataAvailable && _stream.Read(buffer, 0, buffer.Length) > 0) { }
    }

    public void Dispose()
    {
        _stream?.Dispose();
        _client?.Dispose();
    }
}
