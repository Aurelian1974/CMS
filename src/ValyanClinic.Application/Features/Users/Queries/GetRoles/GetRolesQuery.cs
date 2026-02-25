using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;

namespace ValyanClinic.Application.Features.Users.Queries.GetRoles;

/// <summary>Query care returnează toate rolurile active (nomenclator).</summary>
public sealed record GetRolesQuery : IRequest<Result<IReadOnlyList<RoleDto>>>;
