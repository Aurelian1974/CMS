using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetSyncHistory;

public sealed class GetCnasSyncHistoryQueryHandler(ICnasSyncRepository repository)
    : IRequestHandler<GetCnasSyncHistoryQuery, Result<IEnumerable<CnasSyncHistoryDto>>>
{
    public async Task<Result<IEnumerable<CnasSyncHistoryDto>>> Handle(
        GetCnasSyncHistoryQuery request, CancellationToken cancellationToken)
    {
        var history = await repository.GetSyncHistoryAsync(
            Math.Clamp(request.Count, 1, 100), cancellationToken);
        return Result<IEnumerable<CnasSyncHistoryDto>>.Success(history);
    }
}
