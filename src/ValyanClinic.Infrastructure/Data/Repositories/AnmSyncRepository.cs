using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;
using ValyanClinic.Infrastructure.Data;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Implementare Dapper pentru log-urile de sincronizare ANM și interogarea nomenclatorului.</summary>
public sealed class AnmSyncRepository(DapperContext context) : IAnmSyncRepository
{
    // ── Sync log ──────────────────────────────────────────────────────────────

    public async Task<Guid> CreateSyncLogAsync(string triggeredBy, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO dbo.Anm_SyncLog (TriggeredBy, Status, StartedAt)
            OUTPUT INSERTED.Id
            VALUES (@TriggeredBy, 'Running', GETDATE());
            """;

        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid>(
            new CommandDefinition(sql, new { TriggeredBy = triggeredBy }, cancellationToken: ct));
    }

    public async Task UpdateSyncLogAsync(AnmSyncLogUpdateDto dto, CancellationToken ct)
    {
        const string sql = """
            UPDATE dbo.Anm_SyncLog
            SET Status          = @Status,
                FinishedAt      = GETDATE(),
                TotalProcessed  = @TotalProcessed,
                TotalInserted   = @TotalInserted,
                TotalUpdated    = @TotalUpdated,
                DurationSeconds = @DurationSeconds,
                ErrorMessage    = @ErrorMessage
            WHERE Id = @Id;
            """;

        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(new CommandDefinition(sql, dto, cancellationToken: ct));
    }

    public async Task<AnmSyncStatusDto?> GetSyncStatusAsync(Guid logId, CancellationToken ct)
    {
        const string sql = """
            SELECT Id, Status, StartedAt, FinishedAt,
                   TotalProcessed, TotalInserted, TotalUpdated,
                   DurationSeconds, ErrorMessage
            FROM dbo.Anm_SyncLog
            WHERE Id = @Id;
            """;

        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<AnmSyncStatusDto>(
            new CommandDefinition(sql, new { Id = logId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<AnmSyncHistoryDto>> GetSyncHistoryAsync(int count, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (@Count) Id, StartedAt, FinishedAt, Status,
                   TotalProcessed, TotalInserted, TotalUpdated,
                   DurationSeconds, TriggeredBy, ErrorMessage
            FROM dbo.Anm_SyncLog
            ORDER BY StartedAt DESC;
            """;

        using var conn = context.CreateConnection();
        return await conn.QueryAsync<AnmSyncHistoryDto>(
            new CommandDefinition(sql, new { Count = count }, cancellationToken: ct));
    }

    public async Task<AnmSyncStatsDto> GetCurrentStatsAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT
                (SELECT MAX(FinishedAt) FROM dbo.Anm_SyncLog WHERE Status = 'Success')   AS LastSyncAt,
                (SELECT TOP 1 Status    FROM dbo.Anm_SyncLog ORDER BY StartedAt DESC)    AS LastSyncStatus,
                (SELECT COUNT(*)        FROM dbo.Anm_Drug)                               AS TotalDrugs,
                (SELECT COUNT(*)        FROM dbo.Anm_Drug WHERE IsActive = 1)            AS ActiveDrugs;
            """;

        using var conn = context.CreateConnection();
        return await conn.QuerySingleAsync<AnmSyncStatsDto>(
            new CommandDefinition(sql, cancellationToken: ct));
    }

    // ── Nomenclator — listare paginată ────────────────────────────────────────

    public async Task<PagedResult<AnmDrugDto>> GetDrugsPagedAsync(
        string? search, bool? isActive, bool? isCompensated, int page, int pageSize, CancellationToken ct)
    {
        var offset = (page - 1) * pageSize;

        var whereClause = BuildWhereClause(search, isActive, isCompensated, out var parameters);

        var countSql = $"""
            SELECT COUNT(*) FROM dbo.Anm_Drug d {whereClause};
            """;

        var dataSql = $"""
            SELECT d.AuthorizationCode, d.CommercialName, d.InnName, d.PharmaceuticalForm,
                   d.AtcCode, d.Company, d.Country, d.DispenseMode, d.IsActive,
                   CAST(IIF(EXISTS (
                       SELECT 1 FROM dbo.Cnas_CopaymentListActiveSubst cls
                       WHERE cls.IsActive = 1 AND cls.ActiveSubstanceCode = d.InnName
                   ), 1, 0) AS BIT) AS IsCompensated
            FROM dbo.Anm_Drug d
            {whereClause}
            ORDER BY d.CommercialName
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
            """;

        parameters["Offset"]   = offset;
        parameters["PageSize"] = pageSize;

        using var conn = context.CreateConnection();

        var totalCount = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, parameters, cancellationToken: ct));

        var items = await conn.QueryAsync<AnmDrugDto>(
            new CommandDefinition(dataSql, parameters, cancellationToken: ct));

        return new PagedResult<AnmDrugDto>(items.ToList(), totalCount, page, pageSize);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private static string BuildWhereClause(
        string? search, bool? isActive, bool? isCompensated,
        out Dictionary<string, object?> parameters)
    {
        parameters = new Dictionary<string, object?>();
        var conditions = new List<string>();

        if (!string.IsNullOrWhiteSpace(search))
        {
            conditions.Add("""
                (d.CommercialName LIKE '%' + @Search + '%'
                 OR d.InnName     LIKE '%' + @Search + '%'
                 OR d.AuthorizationCode = @SearchExact)
                """);
            parameters["Search"]      = search.Trim();
            parameters["SearchExact"] = search.Trim();
        }

        if (isActive.HasValue)
        {
            conditions.Add("d.IsActive = @IsActive");
            parameters["IsActive"] = isActive.Value ? 1 : 0;
        }

        if (isCompensated.HasValue)
        {
            if (isCompensated.Value)
                conditions.Add("""
                    EXISTS (
                        SELECT 1 FROM dbo.Cnas_CopaymentListActiveSubst cls
                        WHERE cls.IsActive = 1 AND cls.ActiveSubstanceCode = d.InnName
                    )
                    """);
            else
                conditions.Add("""
                    NOT EXISTS (
                        SELECT 1 FROM dbo.Cnas_CopaymentListActiveSubst cls
                        WHERE cls.IsActive = 1 AND cls.ActiveSubstanceCode = d.InnName
                    )
                    """);
        }

        return conditions.Count > 0
            ? "WHERE " + string.Join(" AND ", conditions)
            : string.Empty;
    }
}
