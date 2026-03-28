using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Features.Anm.Queries.GetCurrentStats;

public sealed record GetAnmCurrentStatsQuery : IRequest<Result<AnmSyncStatsDto>>;
