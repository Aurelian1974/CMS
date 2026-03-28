using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Anm.Commands.TriggerSync;

public sealed class TriggerAnmSyncCommandHandler(
    IAnmNomenclatorService syncService,
    ICurrentUser currentUser)
    : IRequestHandler<TriggerAnmSyncCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        TriggerAnmSyncCommand request, CancellationToken cancellationToken)
    {
        var triggeredBy = $"manual:{currentUser.Email}";
        var jobId = await syncService.StartSyncAsync(triggeredBy, cancellationToken);
        return Result<Guid>.Success(jobId);
    }
}
