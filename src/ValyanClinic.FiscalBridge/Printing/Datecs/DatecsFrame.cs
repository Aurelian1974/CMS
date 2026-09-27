namespace ValyanClinic.FiscalBridge.Printing.Datecs;

/// <summary>
/// Împachetarea cadrelor protocolului Datecs clasic.
/// <para>Cerere:   01 LEN SEQ CMD DATA 05 BCC(4) 03</para>
/// <para>Răspuns:  01 LEN SEQ CMD DATA 04 STATUS(6) 05 BCC(4) 03</para>
/// LEN = numărul de octeți de după 01 până la 05 inclusiv + 20h. BCC = suma acelorași octeți,
/// transmisă ca 4 cifre hexa, fiecare nibble + 30h.
/// NEVERIFICAT PE APARAT — formatul e cel din documentația protocolului clasic.
/// </summary>
public static class DatecsFrame
{
    public static byte[] BuildRequest(byte sequence, byte command, ReadOnlySpan<byte> data)
    {
        if (data.Length > DatecsControl.MaxDataLength)
            throw new ArgumentException($"Datele comenzii depășesc {DatecsControl.MaxDataLength} octeți.", nameof(data));
        if (sequence is < DatecsControl.MinSequence or > DatecsControl.MaxSequence)
            throw new ArgumentOutOfRangeException(nameof(sequence));

        // LEN, SEQ, CMD, DATA, 05
        var counted = 4 + data.Length;
        var frame = new byte[1 + counted + DatecsControl.ChecksumLength + 1];

        frame[0] = DatecsControl.Preamble;
        frame[1] = (byte)(DatecsControl.Offset + counted);
        frame[2] = sequence;
        frame[3] = command;
        data.CopyTo(frame.AsSpan(4));
        frame[4 + data.Length] = DatecsControl.Terminator;

        WriteChecksum(frame.AsSpan(1, counted), frame.AsSpan(1 + counted, DatecsControl.ChecksumLength));
        frame[^1] = DatecsControl.Postamble;
        return frame;
    }

    /// <summary>Validează și decodează un răspuns complet (de la 01 la 03 inclusiv).</summary>
    public static DatecsResponse ParseResponse(ReadOnlySpan<byte> frame)
    {
        if (frame.Length < 1 + 11 + DatecsControl.ChecksumLength + 1)
            throw new DatecsProtocolException("Răspuns prea scurt.");
        if (frame[0] != DatecsControl.Preamble || frame[^1] != DatecsControl.Postamble)
            throw new DatecsProtocolException("Delimitatori de cadru invalizi.");

        var counted = frame[1] - DatecsControl.Offset;
        if (counted < 11 || frame.Length != 1 + counted + DatecsControl.ChecksumLength + 1)
            throw new DatecsProtocolException("Lungimea declarată nu corespunde cadrului primit.");

        var terminatorIndex = counted;          // 05
        var separatorIndex = counted - 7;       // 04, urmat de 6 octeți de status
        if (frame[terminatorIndex] != DatecsControl.Terminator || frame[separatorIndex] != DatecsControl.Separator)
            throw new DatecsProtocolException("Separatorii de status lipsesc.");

        Span<byte> expected = stackalloc byte[DatecsControl.ChecksumLength];
        WriteChecksum(frame.Slice(1, counted), expected);
        if (!expected.SequenceEqual(frame.Slice(1 + counted, DatecsControl.ChecksumLength)))
            throw new DatecsProtocolException("Suma de control a răspunsului este greșită.");

        return new DatecsResponse(
            Sequence: frame[2],
            Command: frame[3],
            Data: frame[4..separatorIndex].ToArray(),
            Status: new DatecsStatus(frame.Slice(separatorIndex + 1, DatecsControl.StatusLength)));
    }

    internal static void WriteChecksum(ReadOnlySpan<byte> counted, Span<byte> destination)
    {
        var sum = 0;
        foreach (var b in counted) sum += b;
        sum &= 0xFFFF;

        destination[0] = (byte)(((sum >> 12) & 0x0F) + 0x30);
        destination[1] = (byte)(((sum >> 8) & 0x0F) + 0x30);
        destination[2] = (byte)(((sum >> 4) & 0x0F) + 0x30);
        destination[3] = (byte)((sum & 0x0F) + 0x30);
    }
}
