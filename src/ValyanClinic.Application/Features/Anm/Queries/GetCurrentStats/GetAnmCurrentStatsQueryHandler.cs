using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Features.Anm.Queries.GetCurrentStats;

public sealed class GetAnmCurrentStatsQueryHandler(IAnmSyncRepository repo)
    : IRequestHandler<GetAnmCurrentStatsQuery, Result<AnmSyncStatsDto>>
{
    public async Task<Result<AnmSyncStatsDto>> Handle(
        GetAnmCurrentStatsQuery request, CancellationToken ct)
    {
        var stats = await repo.GetCurrentStatsAsync(ct);
        return Result<AnmSyncStatsDto>.Success(stats);
    }
}
