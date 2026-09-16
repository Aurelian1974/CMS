using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.SecuritySettings.Commands.UpdateRoleSecuritySettings;

public sealed class UpdateRoleSecuritySettingsHandler(
    ISecuritySettingsProvider provider,
    ICurrentUser currentUser,
    ISecurityEventLogger securityLog)
    : IRequestHandler<UpdateRoleSecuritySettingsCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateRoleSecuritySettingsCommand request, CancellationToken ct)
    {
        var before = await provider.GetForRoleAsync(request.RoleId, ct);

        await provider.SaveRoleAsync(
            request.RoleId, request.IdleTimeoutMinutes, request.RefreshTokenDays,
            currentUser.Id, ct);

        // Citim din nou ca sa jurnalizam valoarea efectiva, dupa aplicarea pragurilor.
        var after = await provider.GetForRoleAsync(request.RoleId, ct);

        var changes = new List<string>();
        if (before.IdleTimeoutMinutes != after.IdleTimeoutMinutes)
            changes.Add($"IdleTimeoutMinutes: {before.IdleTimeoutMinutes} -> {after.IdleTimeoutMinutes}");
        if (before.RefreshTokenDays != after.RefreshTokenDays)
            changes.Add($"RefreshTokenDays: {before.RefreshTokenDays} -> {after.RefreshTokenDays}");

        if (changes.Count > 0)
        {
            await securityLog.LogAsync(
                SecurityEventTypes.SecuritySettingsChanged, succeeded: true,
                userId: currentUser.Id, clinicId: currentUser.ClinicId,
                details: $"Rol {after.RoleCode}: {string.Join("; ", changes)}", ct: ct);
        }

        return Result<bool>.Success(true);
    }
}
