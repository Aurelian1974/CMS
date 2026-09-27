namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Permisiunile efective (rol + override-uri) ale unui utilizator, din același cache
/// folosit de [HasAccess] — o singură sursă de adevăr pentru autorizare.
/// </summary>
public interface IEffectivePermissions
{
    /// <summary>moduleCode → nivel de acces (vezi AccessLevel).</summary>
    Task<IReadOnlyDictionary<string, int>> GetLevelsAsync(Guid userId, Guid roleId, CancellationToken ct);
}
