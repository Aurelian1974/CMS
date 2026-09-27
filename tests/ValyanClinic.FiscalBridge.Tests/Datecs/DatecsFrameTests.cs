using ValyanClinic.FiscalBridge.Printing.Datecs;
using ValyanClinic.FiscalBridge.Tests.TestHelpers;

namespace ValyanClinic.FiscalBridge.Tests.Datecs;

public sealed class DatecsFrameTests
{
    [Fact]
    public void BuildRequest_WithoutData_ProducesLengthChecksumAndDelimiters()
    {
        var frame = DatecsFrame.BuildRequest(0x20, 0x4A, []);

        // LEN = 20h + 4 (LEN, SEQ, CMD, 05); BCC = 24h + 20h + 4Ah + 05h = 93h → "0093"
        Assert.Equal(new byte[] { 0x01, 0x24, 0x20, 0x4A, 0x05, 0x30, 0x30, 0x39, 0x33, 0x03 }, frame);
    }

    [Fact]
    public void BuildRequest_WithData_CountsDataInLength()
    {
        var frame = DatecsFrame.BuildRequest(0x21, 0x30, "1,0000,1"u8);

        Assert.Equal(0x20 + 4 + 8, frame[1]);
        Assert.Equal((byte)'1', frame[4]);
        Assert.Equal(0x05, frame[12]);
    }

    [Fact]
    public void BuildRequest_DataTooLong_Throws()
    {
        Assert.Throws<ArgumentException>(() => DatecsFrame.BuildRequest(0x20, 0x31, new byte[214]));
    }

    [Fact]
    public void ParseResponse_ValidFrame_ReturnsDataAndStatus()
    {
        var frame = DeviceFrames.Response(0x2A, 0x38, "12,34"u8.ToArray(), DeviceFrames.Status(2, 3));

        var response = DatecsFrame.ParseResponse(frame);

        Assert.Equal(0x2A, response.Sequence);
        Assert.Equal(0x38, response.Command);
        Assert.Equal("12,34"u8.ToArray(), response.Data);
        Assert.True(response.Status.FiscalReceiptOpen);
    }

    [Fact]
    public void ParseResponse_CorruptedChecksum_Throws()
    {
        var frame = DeviceFrames.Response(0x2A, 0x38, "12,34"u8.ToArray(), DeviceFrames.OkStatus());
        frame[^2] ^= 0x01;

        Assert.Throws<DatecsProtocolException>(() => DatecsFrame.ParseResponse(frame));
    }

    [Fact]
    public void ParseResponse_CorruptedData_Throws()
    {
        var frame = DeviceFrames.Response(0x2A, 0x38, "12,34"u8.ToArray(), DeviceFrames.OkStatus());
        frame[5] = (byte)'9';

        Assert.Throws<DatecsProtocolException>(() => DatecsFrame.ParseResponse(frame));
    }

    [Fact]
    public void ParseResponse_TruncatedFrame_Throws()
    {
        var frame = DeviceFrames.Response(0x2A, 0x38, "12,34"u8.ToArray(), DeviceFrames.OkStatus());

        Assert.Throws<DatecsProtocolException>(() => DatecsFrame.ParseResponse(frame[..^3].Append((byte)0x03).ToArray()));
    }
}
