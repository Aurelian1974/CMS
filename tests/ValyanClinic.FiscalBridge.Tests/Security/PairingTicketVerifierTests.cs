using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using ValyanClinic.FiscalBridge.Configuration;
using ValyanClinic.FiscalBridge.Security;

namespace ValyanClinic.FiscalBridge.Tests.Security;

public sealed class PairingTicketVerifierTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 29, 12, 0, 0, TimeSpan.Zero);

    private readonly ECDsa _serverKey = ECDsa.Create(ECCurve.NamedCurves.nistP256);

    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private PairingTicketVerifier CreateVerifier(string? publicKeyPem = null) => new(
        Options.Create(new BridgeOptions { PairingPublicKey = publicKeyPem ?? _serverKey.ExportSubjectPublicKeyInfoPem() }),
        new FixedTime(Now));

    // Aceeași formă ca BridgePairingTicketIssuer din API
    private static string Ticket(ECDsa key, DateTimeOffset expires, string purpose = PairingTicketVerifier.Purpose, string? nonce = null)
    {
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            purpose,
            clinicId = Guid.NewGuid(),
            userId = Guid.NewGuid(),
            nonce = nonce ?? Guid.NewGuid().ToString(),
            exp = expires.ToUnixTimeSeconds(),
        });
        return $"{B64(payload)}.{B64(key.SignData(payload, HashAlgorithmName.SHA256))}";
    }

    private static string B64(byte[] data) => Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    [Fact]
    public void Verify_SignedByServer_IsValid() =>
        Assert.Equal(PairingTicketStatus.Valid, CreateVerifier().Verify(Ticket(_serverKey, Now.AddSeconds(60))));

    [Fact]
    public void Verify_SameTicketTwice_IsReplayed()
    {
        var verifier = CreateVerifier();
        var ticket = Ticket(_serverKey, Now.AddSeconds(60));

        Assert.Equal(PairingTicketStatus.Valid, verifier.Verify(ticket));
        Assert.Equal(PairingTicketStatus.Replayed, verifier.Verify(ticket));
    }

    [Fact]
    public void Verify_SignedByOtherKey_IsInvalid()
    {
        using var attacker = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        Assert.Equal(PairingTicketStatus.Invalid, CreateVerifier().Verify(Ticket(attacker, Now.AddSeconds(60))));
    }

    [Fact]
    public void Verify_TamperedPayload_IsInvalid()
    {
        var parts = Ticket(_serverKey, Now.AddSeconds(60)).Split('.');
        var forged = B64(Encoding.UTF8.GetBytes($$"""{"purpose":"{{PairingTicketVerifier.Purpose}}","nonce":"x","exp":{{Now.AddDays(1).ToUnixTimeSeconds()}}}"""));

        Assert.Equal(PairingTicketStatus.Invalid, CreateVerifier().Verify($"{forged}.{parts[1]}"));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(3600)]
    public void Verify_ExpiredOrTooLongLived_IsExpired(int secondsFromNow) =>
        Assert.Equal(PairingTicketStatus.Expired, CreateVerifier().Verify(Ticket(_serverKey, Now.AddSeconds(secondsFromNow))));

    [Fact]
    public void Verify_OtherPurpose_IsInvalid() =>
        Assert.Equal(PairingTicketStatus.Invalid, CreateVerifier().Verify(Ticket(_serverKey, Now.AddSeconds(60), purpose: "other")));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("abc")]
    [InlineData("a.b.c")]
    [InlineData("!!!.???")]
    public void Verify_Malformed_IsInvalid(string? ticket) =>
        Assert.Equal(PairingTicketStatus.Invalid, CreateVerifier().Verify(ticket));

    [Theory]
    [InlineData("")]
    [InlineData("nu e o cheie")]
    public void Verify_PublicKeyMissingOrMalformed_IsNotConfigured(string publicKey) =>
        Assert.Equal(PairingTicketStatus.NotConfigured, CreateVerifier(publicKey).Verify(Ticket(_serverKey, Now.AddSeconds(60))));
}
