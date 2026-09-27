using ValyanClinic.FiscalBridge.Printing.Datecs;
using ValyanClinic.FiscalBridge.Tests.TestHelpers;

namespace ValyanClinic.FiscalBridge.Tests.Datecs;

public sealed class DatecsStatusTests
{
    [Fact]
    public void OkStatus_HasNoErrors()
    {
        var status = new DatecsStatus(DeviceFrames.OkStatus());

        Assert.False(status.CommandFailed);
        Assert.Empty(status.Describe());
    }

    [Theory]
    [InlineData(0, 0)] // eroare de sintaxă
    [InlineData(0, 1)] // comandă invalidă
    [InlineData(0, 5)] // eroare generală
    [InlineData(1, 0)] // depășire
    [InlineData(1, 1)] // comandă nepermisă
    public void ErrorBits_MarkCommandAsFailed(int byteIndex, int bit)
    {
        Assert.True(new DatecsStatus(DeviceFrames.Status(byteIndex, bit)).CommandFailed);
    }

    [Fact]
    public void PaperAndCoverBits_AreDecoded()
    {
        var paper = new DatecsStatus(DeviceFrames.Status(2, 0));
        var cover = new DatecsStatus(DeviceFrames.Status(0, 6));

        Assert.True(paper.PaperOut);
        Assert.True(cover.CoverOpen);
        Assert.Contains("Lipsă hârtie.", paper.Describe());
    }

    [Fact]
    public void WrongLength_Throws()
    {
        Assert.Throws<ArgumentException>(() => new DatecsStatus(new byte[5]));
    }
}
