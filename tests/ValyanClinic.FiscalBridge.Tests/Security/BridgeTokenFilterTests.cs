using ValyanClinic.FiscalBridge.Security;

namespace ValyanClinic.FiscalBridge.Tests.Security;

public sealed class BridgeTokenFilterTests
{
    [Fact]
    public void IsValid_MatchingToken_ReturnsTrue() =>
        Assert.True(BridgeTokenFilter.IsValid("abc123", "abc123"));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("abc12")]
    [InlineData("abc1234")]
    [InlineData("ABC123")]
    public void IsValid_MissingOrDifferentToken_ReturnsFalse(string? provided) =>
        Assert.False(BridgeTokenFilter.IsValid(provided, "abc123"));
}
