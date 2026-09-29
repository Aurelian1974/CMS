using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using ValyanClinic.FiscalBridge.Configuration;

namespace ValyanClinic.FiscalBridge.Security;

public enum PairingTicketStatus
{
    Valid,
    NotConfigured,
    Invalid,
    Expired,
    Replayed,
}

/// <summary>
/// Verifică tichetele de asociere emise de serverul ValyanClinic (BridgePairingTicketIssuer):
/// base64url(payload JSON) + "." + base64url(semnătură ECDSA P-256 / SHA-256, IEEE P1363).
/// Un tichet se folosește o singură dată și are o valabilitate scurtă.
/// </summary>
public sealed class PairingTicketVerifier(IOptions<BridgeOptions> options, TimeProvider time)
{
    public const string Purpose = "fiscal-bridge-pairing";

    // Un tichet cu expirare mai îndepărtată nu vine de la emitentul configurat normal
    private static readonly TimeSpan MaxLifetime = TimeSpan.FromMinutes(5);

    private readonly ConcurrentDictionary<string, DateTimeOffset> _usedNonces = new();

    public PairingTicketStatus Verify(string? ticket)
    {
        var publicKeyPem = options.Value.PairingPublicKey;
        if (string.IsNullOrWhiteSpace(publicKeyPem)) return PairingTicketStatus.NotConfigured;
        if (string.IsNullOrWhiteSpace(ticket)) return PairingTicketStatus.Invalid;

        var parts = ticket.Split('.');
        if (parts.Length != 2) return PairingTicketStatus.Invalid;

        byte[] payload, signature;
        try
        {
            payload = FromBase64Url(parts[0]);
            signature = FromBase64Url(parts[1]);
        }
        catch (FormatException)
        {
            return PairingTicketStatus.Invalid;
        }

        using (var key = ECDsa.Create())
        {
            try
            {
                key.ImportFromPem(publicKeyPem);
            }
            catch (Exception ex) when (ex is ArgumentException or CryptographicException)
            {
                return PairingTicketStatus.NotConfigured;
            }
            if (!key.VerifyData(payload, signature, HashAlgorithmName.SHA256)) return PairingTicketStatus.Invalid;
        }

        TicketPayload? data;
        try
        {
            data = JsonSerializer.Deserialize<TicketPayload>(payload);
        }
        catch (JsonException)
        {
            return PairingTicketStatus.Invalid;
        }
        if (data is null || data.Purpose != Purpose || string.IsNullOrEmpty(data.Nonce)) return PairingTicketStatus.Invalid;

        var now = time.GetUtcNow();
        var expires = DateTimeOffset.FromUnixTimeSeconds(data.Exp);
        if (expires <= now || expires - now > MaxLifetime) return PairingTicketStatus.Expired;

        foreach (var (nonce, exp) in _usedNonces)
            if (exp <= now) _usedNonces.TryRemove(nonce, out _);

        return _usedNonces.TryAdd(data.Nonce, expires) ? PairingTicketStatus.Valid : PairingTicketStatus.Replayed;
    }

    private static byte[] FromBase64Url(string value)
    {
        var s = value.Replace('-', '+').Replace('_', '/');
        return Convert.FromBase64String(s.PadRight(s.Length + (4 - s.Length % 4) % 4, '='));
    }

    private sealed record TicketPayload(
        [property: JsonPropertyName("purpose")] string? Purpose,
        [property: JsonPropertyName("nonce")] string? Nonce,
        [property: JsonPropertyName("exp")] long Exp);
}
