using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.AuditLogs.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru jurnalul de audit (exclusiv prin Stored Procedures).</summary>
public sealed class AuditLogRepository(DapperContext context) : IAuditLogRepository
{
    public async Task<AuditLogPagedResult> GetPagedAsync(
        Guid clinicId,
        string? entityType,
        Guid? entityId,
        string? action,
        Guid? changedBy,
        DateTime? dateFrom,
        DateTime? dateTo,
        int page,
        int pageSize,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();

        var rows = (await connection.QueryAsync<AuditLogRow>(
            new CommandDefinition(
                AuditLogProcedures.GetPaged,
                new
                {
                    ClinicId   = clinicId,
                    EntityType = entityType,
                    EntityId   = entityId,
                    Action     = action,
                    ChangedBy  = changedBy,
                    DateFrom   = dateFrom,
                    DateTo     = dateTo,
                    Page       = page,
                    PageSize   = pageSize
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct))).AsList();

        var totalCount = rows.Count > 0 ? rows[0].TotalCount : 0;

        var items = rows.Select(r => new AuditLogDto
        {
            Id            = r.Id,
            EntityType    = r.EntityType,
            EntityId      = r.EntityId,
            Action        = r.Action,
            OldValues     = r.OldValues,
            NewValues     = r.NewValues,
            ChangedBy     = r.ChangedBy,
            ChangedByName = r.ChangedByName,
            ChangedAt     = r.ChangedAt
        }).ToList();

        return new AuditLogPagedResult
        {
            Items      = items,
            TotalCount = totalCount,
            Page       = page,
            PageSize   = pageSize
        };
    }

    // Internal row mapping — include TotalCount din COUNT(*) OVER()
    private sealed class AuditLogRow
    {
        public Guid Id { get; init; }
        public string EntityType { get; init; } = default!;
        public Guid EntityId { get; init; }
        public string Action { get; init; } = default!;
        public string? OldValues { get; init; }
        public string? NewValues { get; init; }
        public Guid ChangedBy { get; init; }
        public string? ChangedByName { get; init; }
        public DateTime ChangedAt { get; init; }
        public int TotalCount { get; init; }
    }
}
