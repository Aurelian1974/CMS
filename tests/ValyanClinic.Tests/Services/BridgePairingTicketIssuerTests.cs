using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Options;
using ValyanClinic.Infrastructure.Configuration;
using ValyanClinic.Infrastructure.Services;
using Xunit;

namespace ValyanClinic.Tests.Services;

public sealed class BridgePairingTicketIssuerTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 29, 12, 0, 0, TimeSpan.Zero);

    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private static byte[] FromB64(string s)
    {
        s = s.Replace('-', '+').Replace('_', '/');
        return Convert.FromBase64String(s.PadRight(s.Length + (4 - s.Length % 4) % 4, '='));
    }

    [Fact]
    public void Issue_TicketIsVerifiableWithPublishedKey_AndCarriesExpiry()
    {
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var issuer = new BridgePairingTicketIssuer(
            Options.Create(new FiscalBridgeOptions { PairingPrivateKey = key.ExportPkcs8PrivateKeyPem(), PairingTicketLifetimeSeconds = 60 }),
            new FixedTime(Now));

        var parts = issuer.Issue(Guid.NewGuid(), Guid.NewGuid()).Ticket.Split('.');

        using var publicKey = ECDsa.Create();
        publicKey.ImportFromPem(issuer.GetPublicKeyPem());
        var payload = FromB64(parts[0]);
        Assert.True(publicKey.VerifyData(payload, FromB64(parts[1]), HashAlgorithmName.SHA256));

        using var json = JsonDocument.Parse(payload);
        Assert.Equal(BridgePairingTicketIssuer.Purpose, json.RootElement.GetProperty("purpose").GetString());
        Assert.Equal(Now.AddSeconds(60).ToUnixTimeSeconds(), json.RootElement.GetProperty("exp").GetInt64());
    }

    [Fact]
    public void IsConfigured_EmptyKey_IsFalse() =>
        Assert.False(new BridgePairingTicketIssuer(Options.Create(new FiscalBridgeOptions()), TimeProvider.System).IsConfigured);
}
