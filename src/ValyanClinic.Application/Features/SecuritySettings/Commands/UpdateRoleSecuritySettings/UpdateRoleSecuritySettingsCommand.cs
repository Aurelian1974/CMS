using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.SecuritySettings.Commands.UpdateRoleSecuritySettings;

/// <summary>Setarile de sesiune ale unui rol.</summary>
public sealed record UpdateRoleSecuritySettingsCommand(
    Guid RoleId,
    int IdleTimeoutMinutes,
    int RefreshTokenDays
) : IRequest<Result<bool>>;
