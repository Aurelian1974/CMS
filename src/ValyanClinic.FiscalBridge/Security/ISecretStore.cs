namespace ValyanClinic.FiscalBridge.Security;

/// <summary>Secretele locale ale bridge-ului: token-ul de asociere cu browserul și parola operatorului.</summary>
public interface ISecretStore
{
    /// <summary>Token-ul cerut în antetul X-Bridge-Token. Se generează la primul start.</summary>
    string GetOrCreateToken();

    string RotateToken();

    string? GetOperatorPassword();

    void SetOperatorPassword(string password);
}
