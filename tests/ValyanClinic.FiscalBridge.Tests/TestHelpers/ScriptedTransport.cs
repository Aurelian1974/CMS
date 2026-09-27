using System.Text;
using ValyanClinic.FiscalBridge.Printing.Datecs;

namespace ValyanClinic.FiscalBridge.Tests.TestHelpers;

/// <summary>
/// Transport în memorie: fiecare cadru scris e decodat și dat unui „aparat" care decide
/// ce octeți se întorc (răspuns, SYN, NAK sau nimic).
/// </summary>
public sealed class ScriptedTransport(Func<byte, byte, string, IEnumerable<byte[]>> device) : IDatecsTransport
{
    private readonly Queue<byte> _incoming = new();

    public List<(byte Sequence, byte Command, string Data)> Requests { get; } = [];

    public void EnsureOpen() { }

    public Task WriteAsync(byte[] data, CancellationToken ct)
    {
        var (seq, cmd, payload) = DeviceFrames.ParseRequest(data);
        var text = Encoding.Latin1.GetString(payload);
        Requests.Add((seq, cmd, text));
        foreach (var chunk in device(seq, cmd, text))
            foreach (var b in chunk) _incoming.Enqueue(b);
        return Task.CompletedTask;
    }

    public Task<int> ReadByteAsync(int timeoutMs, CancellationToken ct) =>
        Task.FromResult(_incoming.Count > 0 ? _incoming.Dequeue() : -1);

    public void DiscardInput() => _incoming.Clear();

    public void Dispose() { }
}
