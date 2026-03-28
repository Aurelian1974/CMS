using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Features.Anm.Queries.GetSyncStatus;

public sealed class GetAnmSyncStatusQueryHandler(IAnmSyncRepository repo)
    : IRequestHandler<GetAnmSyncStatusQuery, Result<AnmSyncStatusDto>>
{
    public async Task<Result<AnmSyncStatusDto>> Handle(
        GetAnmSyncStatusQuery request, CancellationToken ct)
    {
        var status = await repo.GetSyncStatusAsync(request.JobId, ct);
        if (status is null)
            return Result<AnmSyncStatusDto>.Failure("Job de sincronizare ANM negăsit.", 404);
        return Result<AnmSyncStatusDto>.Success(status);
    }
}
