using ValyanClinic.Application.Features.SecuritySettings.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Acces la setarile de securitate administrabile, cu cache.
///
/// Valorile returnate sunt intotdeauna trecute prin SecuritySettingsLimits.Sanitize,
/// deci apelantii nu au nevoie sa verifice praguri.
/// </summary>
public interface ISecuritySettingsProvider
{
    Task<SecuritySettingsDto> GetAsync(CancellationToken ct = default);

    /// <summary>Setarile de sesiune ale tuturor rolurilor active.</summary>
    Task<IReadOnlyList<RoleSecuritySettingsDto>> GetRoleSettingsAsync(CancellationToken ct = default);

    /// <summary>
    /// Setarile rolului indicat. Daca rolul nu are rand propriu, returneaza valorile
    /// implicite in loc sa arunce: o configuratie lipsa nu trebuie sa blocheze login-ul.
    /// </summary>
    Task<RoleSecuritySettingsDto> GetForRoleAsync(Guid roleId, CancellationToken ct = default);

    Task SaveAsync(SecuritySettingsDto settings, Guid updatedBy, CancellationToken ct = default);

    Task SaveRoleAsync(
        Guid roleId, int idleTimeoutMinutes, int refreshTokenDays,
        Guid updatedBy, CancellationToken ct = default);
}
