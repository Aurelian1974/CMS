using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;
using ValyanClinic.Infrastructure.Configuration;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Tichet = base64url(payload JSON) + "." + base64url(semnătură ECDSA P-256 / SHA-256, format IEEE P1363).
/// Contractul e duplicat în ValyanClinic.FiscalBridge (PairingTicketVerifier) — proiectele nu se referă.
/// </summary>
public sealed class BridgePairingTicketIssuer(IOptions<FiscalBridgeOptions> options, TimeProvider time)
    : IBridgePairingTicketIssuer
{
    public const string Purpose = "fiscal-bridge-pairing";

    private readonly FiscalBridgeOptions _options = options.Value;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.PairingPrivateKey);

    public string GetPublicKeyPem()
    {
        using var key = LoadKey();
        return key.ExportSubjectPublicKeyInfoPem();
    }

    public BridgePairingTicketDto Issue(Guid clinicId, Guid userId)
    {
        var now = time.GetUtcNow();
        var expires = now.AddSeconds(_options.PairingTicketLifetimeSeconds);

        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            purpose = Purpose,
            clinicId,
            userId,
            nonce = Guid.NewGuid(),
            exp = expires.ToUnixTimeSeconds(),
        });

        using var key = LoadKey();
        var signature = key.SignData(payload, HashAlgorithmName.SHA256);

        return new BridgePairingTicketDto
        {
            Ticket = $"{Base64Url(payload)}.{Base64Url(signature)}",
            ExpiresAt = expires.LocalDateTime,
        };
    }

    private ECDsa LoadKey()
    {
        if (!IsConfigured)
            throw new InvalidOperationException("FiscalBridge:PairingPrivateKey nu este configurată.");

        var key = ECDsa.Create();
        key.ImportFromPem(_options.PairingPrivateKey);
        return key;
    }

    private static string Base64Url(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
