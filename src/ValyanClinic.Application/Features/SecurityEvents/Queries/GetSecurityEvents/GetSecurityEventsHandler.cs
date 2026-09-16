using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.SecurityEvents.DTOs;

namespace ValyanClinic.Application.Features.SecurityEvents.Queries.GetSecurityEvents;

public sealed class GetSecurityEventsHandler(ISecurityEventRepository repository)
    : IRequestHandler<GetSecurityEventsQuery, Result<SecurityEventPagedResult>>
{
    public async Task<Result<SecurityEventPagedResult>> Handle(
        GetSecurityEventsQuery request, CancellationToken ct)
    {
        var result = await repository.GetPagedAsync(
            request.EventType,
            request.UserId,
            request.EmailAttempted,
            request.IpAddress,
            request.Succeeded,
            request.DateFrom,
            request.DateTo,
            request.Page,
            request.PageSize,
            ct);

        return Result<SecurityEventPagedResult>.Success(result);
    }
}
