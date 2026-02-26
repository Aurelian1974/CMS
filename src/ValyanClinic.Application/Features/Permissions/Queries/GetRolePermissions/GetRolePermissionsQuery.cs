using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetRolePermissions;

/// <summary>Returnează permisiunile default ale unui rol pe toate modulele.</summary>
public sealed record GetRolePermissionsQuery(Guid RoleId) : IRequest<Result<IReadOnlyList<RoleModulePermissionDto>>>;
