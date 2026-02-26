using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Commands.UpdateRolePermissions;

/// <summary>
/// Actualizează permisiunile default ale unui rol pe toate modulele.
/// Primește lista completă — sincronizare delete + insert (replace all).
/// </summary>
public sealed record UpdateRolePermissionsCommand(
    Guid RoleId,
    IReadOnlyList<RolePermissionItemDto> Permissions
) : IRequest<Result<int>>;

/// <summary>Un element din lista de permisiuni per modul.</summary>
public sealed record RolePermissionItemDto(
    Guid ModuleId,
    Guid AccessLevelId);
