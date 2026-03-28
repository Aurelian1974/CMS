using ValyanClinic.Application.Features.AuditLogs.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru interogarea jurnalului de audit.
/// </summary>
public interface IAuditLogRepository
{
    /// <summary>
    /// Returnează înregistrările de audit paginate pentru clinica curentă.
    /// </summary>
    Task<AuditLogPagedResult> GetPagedAsync(
        Guid clinicId,
        string? entityType,
        Guid? entityId,
        string? action,
        Guid? changedBy,
        DateTime? dateFrom,
        DateTime? dateTo,
        int page,
        int pageSize,
        CancellationToken ct);
}
