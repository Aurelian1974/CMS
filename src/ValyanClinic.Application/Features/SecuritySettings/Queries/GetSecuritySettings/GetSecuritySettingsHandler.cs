using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;

namespace ValyanClinic.Application.Features.SecuritySettings.Queries.GetSecuritySettings;

public sealed class GetSecuritySettingsHandler(ISecuritySettingsProvider provider)
    : IRequestHandler<GetSecuritySettingsQuery, Result<SecuritySettingsViewDto>>
{
    public async Task<Result<SecuritySettingsViewDto>> Handle(
        GetSecuritySettingsQuery request, CancellationToken ct)
    {
        var view = new SecuritySettingsViewDto
        {
            Global = await provider.GetAsync(ct),
            Roles = await provider.GetRoleSettingsAsync(ct),
            Limits = new SecuritySettingsLimitsDto
            {
                MinPasswordLength             = SecuritySettingsLimits.MinPasswordLength,
                MaxPasswordLength             = SecuritySettingsLimits.MaxPasswordLength,
                MinFailedLoginAttempts        = SecuritySettingsLimits.MinFailedLoginAttempts,
                MinLockoutMinutes             = SecuritySettingsLimits.MinLockoutMinutes,
                MinSecurityEventRetentionDays = SecuritySettingsLimits.MinSecurityEventRetentionDays,
                MinRefreshTokenRetentionDays  = SecuritySettingsLimits.MinRefreshTokenRetentionDays,
                MinIdleTimeoutMinutes         = SecuritySettingsLimits.MinIdleTimeoutMinutes,
                MaxIdleTimeoutMinutes         = SecuritySettingsLimits.MaxIdleTimeoutMinutes,
                MinRefreshTokenDays           = SecuritySettingsLimits.MinRefreshTokenDays,
                MaxRefreshTokenDays           = SecuritySettingsLimits.MaxRefreshTokenDays,
            },
        };

        return Result<SecuritySettingsViewDto>.Success(view);
    }
}
