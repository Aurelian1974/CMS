using System.Text;
using ValyanClinic.FiscalBridge.Printing.Datecs;

namespace ValyanClinic.FiscalBridge.Tests.TestHelpers;

/// <summary>
/// Casă de marcat Datecs simulată la nivel de protocol: ține minte dacă are bon deschis,
/// poate respinge sau „înghiți" (fără răspuns) o anumită comandă.
/// </summary>
public sealed class FakeDatecsDevice
{
    public bool ReceiptOpen { get; private set; }
    public int IssuedReceipts { get; private set; }

    /// <summary>Comanda la care aparatul răspunde cu eroare (nu o execută).</summary>
    public byte? RejectCommand { get; set; }

    /// <summary>Comanda pe care aparatul o execută, dar al cărei răspuns se pierde.</summary>
    public byte? SilentCommand { get; set; }

    /// <summary>Răspunsul la plată — „D" achitat, „R" rest de plată.</summary>
    public string PaidCode { get; set; } = "D";

    public FakeDatecsDevice() => Transport = new ScriptedTransport(Handle);

    public ScriptedTransport Transport { get; }

    public IEnumerable<byte> SentCommands => Transport.Requests.Select(r => r.Command);

    public DatecsProtocolClient CreateClient() => new(Transport, Encoding.Latin1, 100, 1000, 2);

    private IEnumerable<byte[]> Handle(byte seq, byte cmd, string data)
    {
        if (cmd == RejectCommand)
            return [DeviceFrames.Response(seq, cmd, [], DeviceFrames.Status(1, 1))]; // comandă nepermisă

        string answer;
        switch (cmd)
        {
            case DatecsCommands.OpenFiscalReceipt:
                ReceiptOpen = true;
                answer = "10,20";
                break;
            case DatecsCommands.Total:
                answer = PaidCode + "100.00";
                break;
            case DatecsCommands.CloseFiscalReceipt:
                ReceiptOpen = false;
                IssuedReceipts++;
                answer = $"{10 + IssuedReceipts},{41 + IssuedReceipts}";
                break;
            case DatecsCommands.CancelFiscalReceipt:
                if (!ReceiptOpen) return [DeviceFrames.Response(seq, cmd, [], DeviceFrames.Status(1, 1))];
                ReceiptOpen = false;
                answer = string.Empty;
                break;
            case DatecsCommands.DiagnosticInfo:
                answer = "DP-25,1.00 01Jan20 1200,ABCD,00000000,DT123456,02123456";
                break;
            default:
                answer = string.Empty;
                break;
        }

        if (cmd == SilentCommand) return [];

        var status = DeviceFrames.OkStatus();
        if (ReceiptOpen) status[2] |= 1 << 3;
        return [[0x16], DeviceFrames.Response(seq, cmd, Encoding.Latin1.GetBytes(answer), status)];
    }
}
