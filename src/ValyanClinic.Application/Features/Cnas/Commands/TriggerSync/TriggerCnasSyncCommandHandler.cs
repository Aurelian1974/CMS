using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Cnas.Commands.TriggerSync;

public sealed class TriggerCnasSyncCommandHandler(
    ICnasNomenclatorService syncService,
    ICurrentUser currentUser)
    : IRequestHandler<TriggerCnasSyncCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        TriggerCnasSyncCommand request, CancellationToken cancellationToken)
    {
        var triggeredBy = $"manual:{currentUser.Email}";
        var jobId = await syncService.StartSyncAsync(triggeredBy, cancellationToken);
        return Result<Guid>.Success(jobId);
    }
}
