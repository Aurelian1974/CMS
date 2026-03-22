using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetCurrentStats;

public sealed class GetCnasCurrentStatsQueryHandler(ICnasSyncRepository repository)
    : IRequestHandler<GetCnasCurrentStatsQuery, Result<CnasSyncStatsDto>>
{
    public async Task<Result<CnasSyncStatsDto>> Handle(
        GetCnasCurrentStatsQuery request, CancellationToken cancellationToken)
    {
        var stats = await repository.GetCurrentStatsAsync(cancellationToken);
        return Result<CnasSyncStatsDto>.Success(stats);
    }
}
