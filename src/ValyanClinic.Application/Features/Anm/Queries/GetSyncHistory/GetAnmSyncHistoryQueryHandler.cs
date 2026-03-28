using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Features.Anm.Queries.GetSyncHistory;

public sealed class GetAnmSyncHistoryQueryHandler(IAnmSyncRepository repo)
    : IRequestHandler<GetAnmSyncHistoryQuery, Result<IEnumerable<AnmSyncHistoryDto>>>
{
    public async Task<Result<IEnumerable<AnmSyncHistoryDto>>> Handle(
        GetAnmSyncHistoryQuery request, CancellationToken ct)
    {
        var history = await repo.GetSyncHistoryAsync(Math.Clamp(request.Count, 1, 100), ct);
        return Result<IEnumerable<AnmSyncHistoryDto>>.Success(history);
    }
}
