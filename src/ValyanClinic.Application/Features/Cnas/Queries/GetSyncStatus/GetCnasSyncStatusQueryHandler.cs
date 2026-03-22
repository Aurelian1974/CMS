using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Features.Cnas.Queries.GetSyncStatus;

public sealed class GetCnasSyncStatusQueryHandler(ICnasSyncRepository repository)
    : IRequestHandler<GetCnasSyncStatusQuery, Result<CnasSyncStatusDto>>
{
    public async Task<Result<CnasSyncStatusDto>> Handle(
        GetCnasSyncStatusQuery request, CancellationToken cancellationToken)
    {
        var status = await repository.GetSyncStatusAsync(request.JobId, cancellationToken);
        return status is null
            ? Result<CnasSyncStatusDto>.NotFound($"Job-ul de sincronizare {request.JobId} nu a fost găsit.")
            : Result<CnasSyncStatusDto>.Success(status);
    }
}
