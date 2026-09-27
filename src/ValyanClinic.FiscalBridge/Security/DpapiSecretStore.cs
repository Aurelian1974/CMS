using System.Runtime.Versioning;
using System.Security.Cryptography;
using System.Text;

namespace ValyanClinic.FiscalBridge.Security;

/// <summary>
/// Secrete criptate cu DPAPI (scope LocalMachine: serviciul și administratorul PC-ului le pot citi,
/// alte mașini nu). Fișierele stau în directorul de date al bridge-ului.
/// </summary>
[SupportedOSPlatform("windows")]
public sealed class DpapiSecretStore(string directory) : ISecretStore
{
    private const string TokenFile = "bridge-token.bin";
    private const string PasswordFile = "operator-password.bin";

    // Entropie suplimentară — un fișier copiat de la alt produs DPAPI nu se decriptează aici
    private static readonly byte[] Entropy = Encoding.UTF8.GetBytes("ValyanClinic.FiscalBridge.v1");

    private readonly Lock _lock = new();

    public string GetOrCreateToken()
    {
        lock (_lock)
        {
            return Read(TokenFile) ?? WriteNewToken();
        }
    }

    public string RotateToken()
    {
        lock (_lock) return WriteNewToken();
    }

    public string? GetOperatorPassword()
    {
        lock (_lock) return Read(PasswordFile);
    }

    public void SetOperatorPassword(string password)
    {
        lock (_lock) Write(PasswordFile, password);
    }

    private string WriteNewToken()
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        Write(TokenFile, token);
        return token;
    }

    private string? Read(string file)
    {
        var path = Path.Combine(directory, file);
        if (!File.Exists(path)) return null;
        var plain = ProtectedData.Unprotect(File.ReadAllBytes(path), Entropy, DataProtectionScope.LocalMachine);
        return Encoding.UTF8.GetString(plain);
    }

    private void Write(string file, string value)
    {
        Directory.CreateDirectory(directory);
        var cipher = ProtectedData.Protect(Encoding.UTF8.GetBytes(value), Entropy, DataProtectionScope.LocalMachine);
        File.WriteAllBytes(Path.Combine(directory, file), cipher);
    }
}
