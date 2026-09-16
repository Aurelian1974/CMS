using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;

namespace ValyanClinic.Application.Features.SecuritySettings.Commands.UpdateSecuritySettings;

/// <summary>
/// Salveaza setarile globale si jurnalizeaza exact ce s-a schimbat.
///
/// Diferenta se calculeaza aici, nu in baza de date: o inregistrare de audit care
/// spune doar "setarile au fost modificate" nu ajuta pe nimeni intr-o investigatie.
/// </summary>
public sealed class UpdateSecuritySettingsHandler(
    ISecuritySettingsProvider provider,
    ICurrentUser currentUser,
    ISecurityEventLogger securityLog)
    : IRequestHandler<UpdateSecuritySettingsCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateSecuritySettingsCommand request, CancellationToken ct)
    {
        var current = await provider.GetAsync(ct);

        var updated = current with
        {
            PasswordMinLength            = request.PasswordMinLength,
            PasswordMaxLength            = request.PasswordMaxLength,
            PasswordMinDigits            = request.PasswordMinDigits,
            PasswordMinSpecial           = request.PasswordMinSpecial,
            PasswordMinUppercase         = request.PasswordMinUppercase,
            PasswordMinLowercase         = request.PasswordMinLowercase,
            PasswordForbidIdentityValues = request.PasswordForbidIdentityValues,
            PasswordHistoryCount         = request.PasswordHistoryCount,
            PasswordExpiryDays           = request.PasswordExpiryDays,
            MaxFailedLoginAttempts       = request.MaxFailedLoginAttempts,
            LockoutMinutes               = request.LockoutMinutes,
            SecurityEventRetentionDays   = request.SecurityEventRetentionDays,
            RefreshTokenRetentionDays    = request.RefreshTokenRetentionDays,
        };

        // Provider-ul aplica pragurile minime; comparam cu valoarea finala, nu cu cea
        // ceruta, ca jurnalul sa arate ce s-a intamplat efectiv.
        var effective = SecuritySettingsLimits.Sanitize(updated);
        var changes = Describe(current, effective);

        if (changes.Count == 0)
            return Result<bool>.Success(true);

        await provider.SaveAsync(effective, currentUser.Id, ct);

        await securityLog.LogAsync(
            SecurityEventTypes.SecuritySettingsChanged, succeeded: true,
            userId: currentUser.Id, clinicId: currentUser.ClinicId,
            details: string.Join("; ", changes), ct: ct);

        return Result<bool>.Success(true);
    }

    /// <summary>Lista modificarilor, in forma "camp: vechi -> nou".</summary>
    private static List<string> Describe(SecuritySettingsDto before, SecuritySettingsDto after)
    {
        var changes = new List<string>();

        void Compare<T>(string name, T old, T @new) where T : notnull
        {
            if (!old.Equals(@new)) changes.Add($"{name}: {old} -> {@new}");
        }

        Compare("PasswordMinLength",            before.PasswordMinLength,            after.PasswordMinLength);
        Compare("PasswordMaxLength",            before.PasswordMaxLength,            after.PasswordMaxLength);
        Compare("PasswordMinDigits",            before.PasswordMinDigits,            after.PasswordMinDigits);
        Compare("PasswordMinSpecial",           before.PasswordMinSpecial,           after.PasswordMinSpecial);
        Compare("PasswordMinUppercase",         before.PasswordMinUppercase,         after.PasswordMinUppercase);
        Compare("PasswordMinLowercase",         before.PasswordMinLowercase,         after.PasswordMinLowercase);
        Compare("PasswordForbidIdentityValues", before.PasswordForbidIdentityValues, after.PasswordForbidIdentityValues);
        Compare("PasswordHistoryCount",         before.PasswordHistoryCount,         after.PasswordHistoryCount);
        Compare("PasswordExpiryDays",           before.PasswordExpiryDays,           after.PasswordExpiryDays);
        Compare("MaxFailedLoginAttempts",       before.MaxFailedLoginAttempts,       after.MaxFailedLoginAttempts);
        Compare("LockoutMinutes",               before.LockoutMinutes,               after.LockoutMinutes);
        Compare("SecurityEventRetentionDays",   before.SecurityEventRetentionDays,   after.SecurityEventRetentionDays);
        Compare("RefreshTokenRetentionDays",    before.RefreshTokenRetentionDays,    after.RefreshTokenRetentionDays);

        return changes;
    }
}
