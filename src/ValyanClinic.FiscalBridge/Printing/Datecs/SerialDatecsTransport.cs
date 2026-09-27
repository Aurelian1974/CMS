using System.IO.Ports;

namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>Transport serial (COM sau USB-COM virtual). 8 biți de date, fără paritate, 1 bit de stop.</summary>
public sealed class SerialDatecsTransport(string portName, int baudRate) : IDatecsTransport
{
    private SerialPort? _port;

    public void EnsureOpen()
    {
        if (_port is { IsOpen: true }) return;

        _port?.Dispose();
        // NEVERIFICAT PE APARAT — parametrii liniei (8N1, fără control de flux) conform documentației
        _port = new SerialPort(portName, baudRate, Parity.None, 8, StopBits.One)
        {
            Handshake = Handshake.None,
            ReadTimeout = 1000,
            WriteTimeout = 2000,
        };
        _port.Open();
    }

    public async Task WriteAsync(byte[] data, CancellationToken ct)
    {
        EnsureOpen();
        await _port!.BaseStream.WriteAsync(data, ct);
        await _port.BaseStream.FlushAsync(ct);
    }

    // Citire sincronă cu ReadTimeout: pe Windows, ReadAsync pe SerialStream nu respectă anularea
    public Task<int> ReadByteAsync(int timeoutMs, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        EnsureOpen();
        _port!.ReadTimeout = timeoutMs;
        try
        {
            return Task.FromResult(_port.ReadByte());
        }
        catch (TimeoutException)
        {
            return Task.FromResult(-1);
        }
    }

    public void DiscardInput()
    {
        if (_port is { IsOpen: true }) _port.DiscardInBuffer();
    }

    public void Dispose() => _port?.Dispose();
}
