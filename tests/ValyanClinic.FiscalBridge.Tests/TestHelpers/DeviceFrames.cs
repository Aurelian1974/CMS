using ValyanClinic.FiscalBridge.Printing.Datecs;

namespace ValyanClinic.FiscalBridge.Tests.TestHelpers;

/// <summary>Cadre construite „din partea aparatului" — pentru a simula răspunsurile în teste.</summary>
public static class DeviceFrames
{
    /// <summary>Status fără erori (bitul 7 e mereu setat în protocolul clasic).</summary>
    public static byte[] OkStatus() => [0x80, 0x80, 0x80, 0x80, 0x80, 0x80];

    public static byte[] Status(int byteIndex, int bit)
    {
        var s = OkStatus();
        s[byteIndex] |= (byte)(1 << bit);
        return s;
    }

    public static byte[] Response(byte sequence, byte command, byte[] data, byte[] status)
    {
        // LEN SEQ CMD | DATA | 04 | STATUS(6) | 05
        var counted = 3 + data.Length + 1 + 6 + 1;
        var frame = new byte[1 + counted + 4 + 1];
        frame[0] = 0x01;
        frame[1] = (byte)(0x20 + counted);
        frame[2] = sequence;
        frame[3] = command;
        data.CopyTo(frame, 4);
        frame[4 + data.Length] = 0x04;
        status.CopyTo(frame, 5 + data.Length);
        frame[counted] = 0x05;
        DatecsFrame.WriteChecksum(frame.AsSpan(1, counted), frame.AsSpan(1 + counted, 4));
        frame[^1] = 0x03;
        return frame;
    }

    /// <summary>Decodează o cerere trimisă de bridge: (secvență, comandă, date).</summary>
    public static (byte Sequence, byte Command, byte[] Data) ParseRequest(byte[] frame)
    {
        var counted = frame[1] - 0x20;
        return (frame[2], frame[3], frame[4..counted]);
    }
}
