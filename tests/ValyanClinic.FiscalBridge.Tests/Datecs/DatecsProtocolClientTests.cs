using System.Text;
using ValyanClinic.FiscalBridge.Printing.Datecs;
using ValyanClinic.FiscalBridge.Tests.TestHelpers;

namespace ValyanClinic.FiscalBridge.Tests.Datecs;

public sealed class DatecsProtocolClientTests
{
    private static DatecsProtocolClient Client(ScriptedTransport transport) => new(transport, Encoding.Latin1, 100, 1000, 2);

    [Fact]
    public async Task SendAsync_SynThenResponse_ReturnsResponse()
    {
        var transport = new ScriptedTransport((seq, cmd, _) =>
            [[0x16], [0x16], DeviceFrames.Response(seq, cmd, "OK"u8.ToArray(), DeviceFrames.OkStatus())]);

        var response = await Client(transport).SendAsync(0x4A, string.Empty, default);

        Assert.Equal("OK"u8.ToArray(), response.Data);
    }

    [Fact]
    public async Task SendAsync_Nak_RetransmitsSameSequence()
    {
        var calls = 0;
        var transport = new ScriptedTransport((seq, cmd, _) =>
            ++calls == 1 ? [[0x15]] : [DeviceFrames.Response(seq, cmd, [], DeviceFrames.OkStatus())]);

        await Client(transport).SendAsync(0x4A, string.Empty, default);

        Assert.Equal(2, transport.Requests.Count);
        Assert.Equal(transport.Requests[0].Sequence, transport.Requests[1].Sequence);
    }

    [Fact]
    public async Task SendAsync_Silence_ThrowsCommunicationException()
    {
        var transport = new ScriptedTransport((_, _, _) => []);

        await Assert.ThrowsAsync<DatecsCommunicationException>(() => Client(transport).SendAsync(0x4A, string.Empty, default));
    }

    [Fact]
    public async Task SendAsync_ErrorStatus_ThrowsDeviceException()
    {
        var transport = new ScriptedTransport((seq, cmd, _) =>
            [DeviceFrames.Response(seq, cmd, [], DeviceFrames.Status(1, 1))]);

        var ex = await Assert.ThrowsAsync<DatecsDeviceException>(() => Client(transport).SendAsync(0x31, "x", default));
        Assert.True(ex.Status.CommandNotPermitted);
    }

    [Fact]
    public async Task SendAsync_StaleResponseFromPreviousCommand_IsIgnored()
    {
        var transport = new ScriptedTransport((seq, cmd, _) =>
        [
            DeviceFrames.Response((byte)(seq == 0x20 ? 0x7F : seq - 1), cmd, "OLD"u8.ToArray(), DeviceFrames.OkStatus()),
            DeviceFrames.Response(seq, cmd, "NEW"u8.ToArray(), DeviceFrames.OkStatus()),
        ]);

        var response = await Client(transport).SendAsync(0x4A, string.Empty, default);

        Assert.Equal("NEW"u8.ToArray(), response.Data);
    }

    [Fact]
    public async Task SendAsync_CorruptedResponse_RetransmitsAndAcceptsRepeatedAnswer()
    {
        var calls = 0;
        var transport = new ScriptedTransport((seq, cmd, _) =>
        {
            var frame = DeviceFrames.Response(seq, cmd, "OK"u8.ToArray(), DeviceFrames.OkStatus());
            if (++calls == 1) frame[^2] ^= 0x01;
            return [frame];
        });

        var response = await Client(transport).SendAsync(0x4A, string.Empty, default);

        Assert.Equal("OK"u8.ToArray(), response.Data);
        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task SendAsync_SequenceIncrementsAndWraps()
    {
        var transport = new ScriptedTransport((seq, cmd, _) => [DeviceFrames.Response(seq, cmd, [], DeviceFrames.OkStatus())]);
        var client = Client(transport);

        for (var i = 0; i < 97; i++) await client.SendAsync(0x4A, string.Empty, default);

        Assert.Equal(0x20, transport.Requests[0].Sequence);
        Assert.Equal(0x7F, transport.Requests[95].Sequence);
        Assert.Equal(0x20, transport.Requests[96].Sequence);
    }
}
