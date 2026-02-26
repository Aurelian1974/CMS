using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetUserEffectivePermissions;

/// <summary>Obține permisiunile efective ale unui utilizator (rol + override-uri) — pentru UI admin.</summary>
public sealed record GetUserEffectivePermissionsQuery(Guid UserId, Guid RoleId)
    : IRequest<Result<IReadOnlyList<UserModulePermissionDto>>>;
