using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.SecuritySettings.Commands.UpdateSecuritySettings;

/// <summary>
/// Setarile globale de securitate. Valorile sunt aduse in intervalele permise la
/// salvare, deci o cerere care incearca sa coboare sub praguri nu esueaza — se
/// aplica pragul, iar jurnalul arata valoarea efectiva.
/// </summary>
public sealed record UpdateSecuritySettingsCommand(
    int PasswordMinLength,
    int PasswordMaxLength,
    int PasswordMinDigits,
    int PasswordMinSpecial,
    int PasswordMinUppercase,
    int PasswordMinLowercase,
    bool PasswordForbidIdentityValues,
    int PasswordHistoryCount,
    int PasswordExpiryDays,
    int MaxFailedLoginAttempts,
    int LockoutMinutes,
    int SecurityEventRetentionDays,
    int RefreshTokenRetentionDays
) : IRequest<Result<bool>>;
