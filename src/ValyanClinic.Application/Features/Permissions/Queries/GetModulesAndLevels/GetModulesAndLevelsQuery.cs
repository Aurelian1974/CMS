using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetModulesAndLevels;

/// <summary>
/// Obține modulele și nivelurile de acces disponibile (pentru populate dropdowns în UI admin).
/// </summary>
public sealed record GetModulesAndLevelsQuery
    : IRequest<Result<ModulesAndLevelsDto>>;

public sealed record ModulesAndLevelsDto
{
    public IReadOnlyList<ModuleDto> Modules { get; init; } = [];
    public IReadOnlyList<AccessLevelDto> AccessLevels { get; init; } = [];
}
