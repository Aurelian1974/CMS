using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AuditLogs.DTOs;

namespace ValyanClinic.Application.Features.AuditLogs.Queries.GetAuditLogs;

/// <summary>Interogare jurnal de audit cu filtre și paginare.</summary>
public sealed record GetAuditLogsQuery(
    string? EntityType,
    Guid? EntityId,
    string? Action,
    Guid? ChangedBy,
    DateTime? DateFrom,
    DateTime? DateTo,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<AuditLogPagedResult>>;
