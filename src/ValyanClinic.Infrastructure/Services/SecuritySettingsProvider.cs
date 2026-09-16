using System.Data;
using Dapper;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;
using ValyanClinic.Infrastructure.Data;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Citeste setarile de securitate din baza de date, cu cache scurt.
///
/// Strategia de cache: TTL absolut de 60 de secunde, plus invalidare locala la
/// salvare. Nu o versiune globala ca la permisiuni — aceea se tine in IMemoryCache,
/// deci pe mai multe instante o modificare nu ajunge la celelalte. TTL-ul rezolva
/// asta fara nicio infrastructura: o setare schimbata pe o instanta devine activa
/// pe toate in cel mult un minut, iar setarile se schimba rar. Invalidarea locala
/// face efectul imediat pentru administratorul care tocmai a salvat.
///
/// Daca baza de date e inaccesibila, cadem pe valorile implicite in loc sa aruncam:
/// o problema de citire a setarilor nu trebuie sa doboare autentificarea.
/// </summary>
public sealed class SecuritySettingsProvider(
    DapperContext context,
    IMemoryCache cache,
    ILogger<SecuritySettingsProvider> logger) : ISecuritySettingsProvider
{
    private const string GlobalCacheKey = "securitysettings:global";
    private const string RolesCacheKey = "securitysettings:roles";

    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(60);

    public async Task<SecuritySettingsDto> GetAsync(CancellationToken ct = default)
    {
        if (cache.TryGetValue(GlobalCacheKey, out SecuritySettingsDto? cached) && cached is not null)
            return cached;

        SecuritySettingsDto settings;
        try
        {
            using var connection = context.CreateConnection();
            var row = await connection.QueryFirstOrDefaultAsync<SecuritySettingsDto>(
                new CommandDefinition(
                    SecuritySettingsProcedures.Get,
                    commandType: CommandType.StoredProcedure,
                    cancellationToken: ct));

            settings = SecuritySettingsLimits.Sanitize(row ?? new SecuritySettingsDto());
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Nu s-au putut citi setarile de securitate; se folosesc valorile implicite.");
            return SecuritySettingsLimits.Sanitize(new SecuritySettingsDto());
        }

        cache.Set(GlobalCacheKey, settings, CacheTtl);
        return settings;
    }

    public async Task<IReadOnlyList<RoleSecuritySettingsDto>> GetRoleSettingsAsync(
        CancellationToken ct = default)
    {
        if (cache.TryGetValue(RolesCacheKey, out IReadOnlyList<RoleSecuritySettingsDto>? cached)
            && cached is not null)
            return cached;

        IReadOnlyList<RoleSecuritySettingsDto> roles;
        try
        {
            using var connection = context.CreateConnection();
            var rows = await connection.QueryAsync<RoleSecuritySettingsDto>(
                new CommandDefinition(
                    SecuritySettingsProcedures.GetAllRoles,
                    commandType: CommandType.StoredProcedure,
                    cancellationToken: ct));

            roles = rows.Select(SecuritySettingsLimits.Sanitize).ToList();
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Nu s-au putut citi setarile de sesiune pe roluri; se folosesc valorile implicite.");
            return [];
        }

        cache.Set(RolesCacheKey, roles, CacheTtl);
        return roles;
    }

    public async Task<RoleSecuritySettingsDto> GetForRoleAsync(
        Guid roleId, CancellationToken ct = default)
    {
        var all = await GetRoleSettingsAsync(ct);
        return all.FirstOrDefault(r => r.RoleId == roleId)
               ?? SecuritySettingsLimits.Sanitize(new RoleSecuritySettingsDto { RoleId = roleId });
    }

    public async Task SaveAsync(
        SecuritySettingsDto settings, Guid updatedBy, CancellationToken ct = default)
    {
        var safe = SecuritySettingsLimits.Sanitize(settings);

        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                SecuritySettingsProcedures.Update,
                new
                {
                    safe.PasswordMinLength,
                    safe.PasswordMaxLength,
                    safe.PasswordMinDigits,
                    safe.PasswordMinSpecial,
                    safe.PasswordMinUppercase,
                    safe.PasswordMinLowercase,
                    safe.PasswordForbidIdentityValues,
                    safe.PasswordHistoryCount,
                    safe.PasswordExpiryDays,
                    safe.MaxFailedLoginAttempts,
                    safe.LockoutMinutes,
                    safe.SecurityEventRetentionDays,
                    safe.RefreshTokenRetentionDays,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        cache.Remove(GlobalCacheKey);
    }

    public async Task SaveRoleAsync(
        Guid roleId, int idleTimeoutMinutes, int refreshTokenDays,
        Guid updatedBy, CancellationToken ct = default)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                SecuritySettingsProcedures.UpdateRole,
                new
                {
                    RoleId = roleId,
                    IdleTimeoutMinutes = idleTimeoutMinutes,
                    RefreshTokenDays = refreshTokenDays,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        cache.Remove(RolesCacheKey);
    }
}
