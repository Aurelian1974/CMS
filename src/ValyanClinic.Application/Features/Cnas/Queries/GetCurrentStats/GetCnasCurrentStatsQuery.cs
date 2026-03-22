using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetCurrentStats;

public sealed record GetCnasCurrentStatsQuery : IRequest<Result<CnasSyncStatsDto>>;
