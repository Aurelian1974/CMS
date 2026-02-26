using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetEffectivePermissions;

/// <summary>
/// Returnează permisiunile efective ale unui utilizator (rol + override-uri combinate).
/// Folosit de admin UI pentru a vedea ce acces efectiv are un user.
/// </summary>
public sealed record GetEffectivePermissionsQuery(Guid UserId, Guid RoleId)
    : IRequest<Result<IReadOnlyList<UserModulePermissionDto>>>;
