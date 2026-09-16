using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.SecurityEvents.DTOs;

namespace ValyanClinic.Application.Features.SecurityEvents.Queries.GetSecurityEvents;

/// <summary>Interogare a jurnalului de securitate, cu filtre si paginare.</summary>
public sealed record GetSecurityEventsQuery(
    string? EventType,
    Guid? UserId,
    string? EmailAttempted,
    string? IpAddress,
    bool? Succeeded,
    DateTime? DateFrom,
    DateTime? DateTo,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<SecurityEventPagedResult>>;
