using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetAllModules;

/// <summary>Returnează lista tuturor modulelor active din sistem.</summary>
public sealed record GetAllModulesQuery : IRequest<Result<IReadOnlyList<ModuleDto>>>;
