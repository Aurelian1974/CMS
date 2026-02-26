using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Permissions.Queries.GetAllAccessLevels;

/// <summary>Returnează lista tuturor nivelurilor de acces (None, Read, Write, Full).</summary>
public sealed record GetAllAccessLevelsQuery : IRequest<Result<IReadOnlyList<AccessLevelDto>>>;
