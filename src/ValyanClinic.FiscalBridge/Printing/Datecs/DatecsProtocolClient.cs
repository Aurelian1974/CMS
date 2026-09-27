using System.Diagnostics;
using System.Text;

namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>
/// Trimite o comandă și așteaptă răspunsul, cu regulile protocolului clasic:
/// <list type="bullet">
/// <item>SYN (16h) = aparatul lucrează — se așteaptă în continuare, până la <c>busyTimeoutMs</c>;</item>
/// <item>NAK (15h) = cadrul nu a ajuns corect — se retrimite cu ACEEAȘI secvență;</item>
/// <item>răspuns cu sumă de control greșită — se retrimite cu aceeași secvență (aparatul retransmite
/// ultimul răspuns fără să reexecute comanda — NEVERIFICAT PE APARAT);</item>
/// <item>tăcere — <see cref="DatecsCommunicationException"/>: rezultatul comenzii e necunoscut.</item>
/// </list>
/// </summary>
public sealed class DatecsProtocolClient(
    IDatecsTransport transport,
    Encoding encoding,
    int responseTimeoutMs,
    int busyTimeoutMs,
    int maxRetransmissions)
{
    private byte _sequence = DatecsControl.MaxSequence;

    public Encoding Encoding => encoding;

    public async Task<DatecsResponse> SendAsync(byte command, string data, CancellationToken ct)
    {
        var sequence = NextSequence();
        var frame = DatecsFrame.BuildRequest(sequence, command, encoding.GetBytes(data));

        try
        {
            transport.EnsureOpen();
            transport.DiscardInput();
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or InvalidOperationException
                                       or System.Net.Sockets.SocketException)
        {
            // Nu s-a trimis nimic — dar apelantul decide, în context, ce înseamnă asta
            throw new DatecsCommunicationException($"Portul casei de marcat nu poate fi deschis: {ex.Message}", ex);
        }

        var retransmissions = 0;
        await WriteAsync(frame, ct);
        var busy = Stopwatch.StartNew();

        while (true)
        {
            var b = await transport.ReadByteAsync(responseTimeoutMs, ct);
            switch (b)
            {
                case -1:
                    throw new DatecsCommunicationException($"Aparatul nu a răspuns la comanda 0x{command:X2}.");

                case DatecsControl.Syn:
                    if (busy.ElapsedMilliseconds > busyTimeoutMs)
                        throw new DatecsCommunicationException($"Aparatul nu a terminat comanda 0x{command:X2} în timp util.");
                    continue;

                case DatecsControl.Nak:
                    if (++retransmissions > maxRetransmissions)
                        throw new DatecsCommunicationException("Aparatul respinge repetat cadrele trimise (NAK).");
                    await WriteAsync(frame, ct);
                    continue;

                case DatecsControl.Preamble:
                    DatecsResponse response;
                    try
                    {
                        response = DatecsFrame.ParseResponse(await ReadFrameAsync(command, ct));
                    }
                    catch (DatecsProtocolException)
                    {
                        if (++retransmissions > maxRetransmissions) throw;
                        await WriteAsync(frame, ct);
                        continue;
                    }

                    // Un răspuns întârziat la o comandă anterioară — se ignoră
                    if (response.Sequence != sequence || response.Command != command) continue;

                    if (response.Status.CommandFailed)
                        throw new DatecsDeviceException(command, response.Status);
                    return response;

                default:
                    continue; // zgomot pe linie
            }
        }
    }

    /// <summary>Datele răspunsului, decodate, împărțite după virgulă.</summary>
    public string[] Fields(DatecsResponse response) => encoding.GetString(response.Data).Split(',');

    private async Task<byte[]> ReadFrameAsync(byte command, CancellationToken ct)
    {
        var buffer = new List<byte>(64) { DatecsControl.Preamble };
        while (buffer.Count < DatecsControl.MaxResponseLength)
        {
            var b = await transport.ReadByteAsync(responseTimeoutMs, ct);
            if (b == -1)
                throw new DatecsCommunicationException($"Răspuns incomplet la comanda 0x{command:X2}.");
            buffer.Add((byte)b);
            if (b == DatecsControl.Postamble) return [.. buffer];
        }
        throw new DatecsProtocolException("Răspuns prea lung.");
    }

    private async Task WriteAsync(byte[] frame, CancellationToken ct)
    {
        try
        {
            await transport.WriteAsync(frame, ct);
        }
        catch (Exception ex) when (ex is IOException or TimeoutException or InvalidOperationException
                                       or System.Net.Sockets.SocketException)
        {
            throw new DatecsCommunicationException($"Scriere eșuată către aparat: {ex.Message}", ex);
        }
    }

    private byte NextSequence()
    {
        _sequence = _sequence >= DatecsControl.MaxSequence ? DatecsControl.MinSequence : (byte)(_sequence + 1);
        return _sequence;
    }
}
