using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AuditLogs.DTOs;

namespace ValyanClinic.Application.Features.AuditLogs.Queries.GetAuditLogs;

public sealed class GetAuditLogsHandler(
    IAuditLogRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAuditLogsQuery, Result<AuditLogPagedResult>>
{
    public async Task<Result<AuditLogPagedResult>> Handle(
        GetAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetPagedAsync(
            currentUser.ClinicId,
            request.EntityType,
            request.EntityId,
            request.Action,
            request.ChangedBy,
            request.DateFrom,
            request.DateTo,
            request.Page,
            request.PageSize,
            cancellationToken);

        return Result<AuditLogPagedResult>.Success(result);
    }
}
