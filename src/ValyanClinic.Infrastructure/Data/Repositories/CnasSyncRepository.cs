using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;
using ValyanClinic.Infrastructure.Data;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Implementare Dapper pentru jurnalul sincronizărilor CNAS și statistici nomenclator.</summary>
public sealed class CnasSyncRepository(DapperContext context) : ICnasSyncRepository
{
    public async Task<Guid> CreateSyncLogAsync(string triggeredBy, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO dbo.NomenclatorSyncLog (TriggeredBy, Status, StartedAt)
            OUTPUT INSERTED.Id
            VALUES (@TriggeredBy, 'Running', GETDATE());
            """;

        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid>(
            new CommandDefinition(sql, new { TriggeredBy = triggeredBy }, cancellationToken: ct));
    }

    public async Task UpdateSyncLogAsync(CnasSyncLogUpdateDto dto, CancellationToken ct)
    {
        const string sql = """
            UPDATE dbo.NomenclatorSyncLog
            SET Status              = @Status,
                FinishedAt          = GETDATE(),
                ErrorMessage        = @ErrorMessage,
                NomenclatorVersion  = @NomenclatorVersion,
                UrlNomenclator      = @UrlNomenclator,
                UrlLista            = @UrlLista,
                DrugsInserted       = @DrugsInserted,
                DrugsUpdated        = @DrugsUpdated,
                CompensatedInserted = @CompensatedInserted,
                CompensatedUpdated  = @CompensatedUpdated,
                ActiveSubstsInserted= @ActiveSubstsInserted,
                DurationSeconds     = @DurationSeconds
            WHERE Id = @Id;
            """;

        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(new CommandDefinition(sql, dto, cancellationToken: ct));
    }

    public async Task<CnasSyncStatusDto?> GetSyncStatusAsync(Guid logId, CancellationToken ct)
    {
        const string sql = """
            SELECT Id, Status, StartedAt, FinishedAt, NomenclatorVersion, ErrorMessage,
                   DrugsInserted, DrugsUpdated, CompensatedInserted, CompensatedUpdated,
                   ActiveSubstsInserted, DurationSeconds
            FROM dbo.NomenclatorSyncLog
            WHERE Id = @Id;
            """;

        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<CnasSyncStatusDto>(
            new CommandDefinition(sql, new { Id = logId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<CnasSyncHistoryDto>> GetSyncHistoryAsync(int count, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (@Count) Id, StartedAt, FinishedAt, Status, NomenclatorVersion,
                   DrugsInserted, DrugsUpdated, CompensatedInserted, CompensatedUpdated,
                   ActiveSubstsInserted, DurationSeconds, TriggeredBy, ErrorMessage
            FROM dbo.NomenclatorSyncLog
            ORDER BY StartedAt DESC;
            """;

        using var conn = context.CreateConnection();
        return await conn.QueryAsync<CnasSyncHistoryDto>(
            new CommandDefinition(sql, new { Count = count }, cancellationToken: ct));
    }

    public async Task<CnasSyncStatsDto> GetCurrentStatsAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT
                (SELECT MAX(FinishedAt) FROM dbo.NomenclatorSyncLog WHERE Status = 'Success')      AS LastSyncAt,
                (SELECT TOP 1 NomenclatorVersion FROM dbo.NomenclatorSyncLog WHERE Status = 'Success'
                 ORDER BY FinishedAt DESC)                                                          AS LastSyncVersion,
                (SELECT TOP 1 Status FROM dbo.NomenclatorSyncLog ORDER BY StartedAt DESC)          AS LastSyncStatus,
                (SELECT COUNT(*) FROM dbo.Cnas_Drug)                                               AS TotalDrugs,
                (SELECT COUNT(*) FROM dbo.Cnas_Drug WHERE IsActive = 1)                            AS ActiveDrugs,
                (SELECT COUNT(DISTINCT DrugCode) FROM dbo.Cnas_CopaymentListDrug WHERE IsActive = 1) AS CompensatedDrugs;
            """;

        using var conn = context.CreateConnection();
        return await conn.QuerySingleAsync<CnasSyncStatsDto>(
            new CommandDefinition(sql, cancellationToken: ct));
    }

    public async Task<PagedResult<CnasDrugDto>> GetDrugsPagedAsync(
        string? search, bool? isActive, bool? isCompensated, int page, int pageSize, CancellationToken ct)
    {
        const string sql = """
            WITH CopaymentAgg AS (
                SELECT DrugCode,
                       STRING_AGG(CopaymentListType, ', ') WITHIN GROUP (ORDER BY CopaymentListType) AS CopaymentLists
                FROM (
                    SELECT DISTINCT DrugCode, CopaymentListType
                    FROM dbo.Cnas_CopaymentListDrug
                    WHERE IsActive = 1
                ) x
                GROUP BY DrugCode
            )
            SELECT d.Code, d.Name, d.ActiveSubstanceCode, d.PharmaceuticalForm,
                   d.PresentationMode, d.Concentration, d.PrescriptionMode, d.AtcCode, d.PricePerPackage,
                   d.IsActive, d.Company,
                   a.AuthorizationCode AS AnmAuthorizationCode,
                   a.CommercialName    AS AnmCommercialName,
                   a.Country           AS AnmCountry,
                   a.DispenseMode      AS AnmDispenseMode,
                   CAST(IIF(a.AuthorizationCode IS NOT NULL, 1, 0) AS BIT) AS IsInAnm,
                   ca.CopaymentLists
            FROM dbo.Cnas_Drug d
            LEFT JOIN dbo.Anm_Drug a ON d.Code = a.AuthorizationCode
            LEFT JOIN CopaymentAgg ca ON d.Code = ca.DrugCode
            WHERE d.ValidTo IS NULL
              AND (@Term IS NULL OR d.Name LIKE @Term OR d.Code LIKE @Term OR d.ActiveSubstanceCode LIKE @Term)
              AND (@IsActive IS NULL OR d.IsActive = @IsActive)
              AND (@IsCompensated IS NULL
                   OR (@IsCompensated = 1 AND ca.CopaymentLists IS NOT NULL)
                   OR (@IsCompensated = 0 AND ca.CopaymentLists IS NULL))
            ORDER BY d.Name
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

            WITH CopaymentAgg AS (
                SELECT DrugCode,
                       STRING_AGG(CopaymentListType, ', ') WITHIN GROUP (ORDER BY CopaymentListType) AS CopaymentLists
                FROM (
                    SELECT DISTINCT DrugCode, CopaymentListType
                    FROM dbo.Cnas_CopaymentListDrug
                    WHERE IsActive = 1
                ) x
                GROUP BY DrugCode
            )
            SELECT COUNT(*)
            FROM dbo.Cnas_Drug d
            LEFT JOIN CopaymentAgg ca ON d.Code = ca.DrugCode
            WHERE d.ValidTo IS NULL
              AND (@Term IS NULL OR d.Name LIKE @Term OR d.Code LIKE @Term OR d.ActiveSubstanceCode LIKE @Term)
              AND (@IsActive IS NULL OR d.IsActive = @IsActive)
              AND (@IsCompensated IS NULL
                   OR (@IsCompensated = 1 AND ca.CopaymentLists IS NOT NULL)
                   OR (@IsCompensated = 0 AND ca.CopaymentLists IS NULL));
            """;

        var offset = (page - 1) * pageSize;
        var term = string.IsNullOrWhiteSpace(search) ? null : $"%{search}%";
        using var conn = context.CreateConnection();
        var multi = await conn.QueryMultipleAsync(new CommandDefinition(sql,
            new { Term = term, IsActive = isActive, IsCompensated = isCompensated, Offset = offset, PageSize = pageSize },
            cancellationToken: ct));

        var items = await multi.ReadAsync<CnasDrugDto>();
        var total = await multi.ReadSingleAsync<int>();
        return new PagedResult<CnasDrugDto>(items, total, page, pageSize);
    }

    public async Task<PagedResult<CnasCompensatedDrugDto>> GetCompensatedDrugsPagedAsync(
        string? search, string? listType, int page, int pageSize, CancellationToken ct)
    {
        const string sql = """
            SELECT ld.Id, ld.DrugCode, d.Name AS DrugName, ld.CopaymentListType,
                   ld.NhpCode, ld.DiseaseCode, ld.MaxPrice, ld.CopaymentValue,
                   ld.ValidFrom, ld.ValidTo, ld.IsActive
            FROM dbo.Cnas_CopaymentListDrug ld
            JOIN dbo.Cnas_Drug d ON d.Code = ld.DrugCode
            WHERE (@Term IS NULL OR d.Name LIKE @Term OR ld.DrugCode LIKE @Term)
              AND (@ListType IS NULL OR ld.CopaymentListType = @ListType)
            ORDER BY d.Name, ld.CopaymentListType
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

            SELECT COUNT(*)
            FROM dbo.Cnas_CopaymentListDrug ld
            JOIN dbo.Cnas_Drug d ON d.Code = ld.DrugCode
            WHERE (@Term IS NULL OR d.Name LIKE @Term OR ld.DrugCode LIKE @Term)
              AND (@ListType IS NULL OR ld.CopaymentListType = @ListType);
            """;

        var offset = (page - 1) * pageSize;
        var term = string.IsNullOrWhiteSpace(search) ? null : $"%{search}%";
        using var conn = context.CreateConnection();
        var multi = await conn.QueryMultipleAsync(new CommandDefinition(sql,
            new { Term = term, ListType = string.IsNullOrWhiteSpace(listType) ? null : listType, Offset = offset, PageSize = pageSize },
            cancellationToken: ct));

        var items = await multi.ReadAsync<CnasCompensatedDrugDto>();
        var total = await multi.ReadSingleAsync<int>();
        return new PagedResult<CnasCompensatedDrugDto>(items, total, page, pageSize);
    }

    public async Task<PagedResult<CnasActiveSubstanceDto>> GetActiveSubstancesPagedAsync(
        string? search, int page, int pageSize, CancellationToken ct)
    {
        const string sql = """
            SELECT Code, ValidFrom
            FROM dbo.Cnas_ActiveSubstance
            WHERE @Term IS NULL OR Code LIKE @Term
            ORDER BY Code
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

            SELECT COUNT(*) FROM dbo.Cnas_ActiveSubstance
            WHERE @Term IS NULL OR Code LIKE @Term;
            """;

        var offset = (page - 1) * pageSize;
        var term = string.IsNullOrWhiteSpace(search) ? null : $"%{search}%";
        using var conn = context.CreateConnection();
        var multi = await conn.QueryMultipleAsync(new CommandDefinition(sql,
            new { Term = term, Offset = offset, PageSize = pageSize },
            cancellationToken: ct));

        var items = await multi.ReadAsync<CnasActiveSubstanceDto>();
        var total = await multi.ReadSingleAsync<int>();
        return new PagedResult<CnasActiveSubstanceDto>(items, total, page, pageSize);
    }

    public async Task<PagedResult<CnasAtcCodeDto>> GetAtcCodesPagedAsync(
        string? search, int page, int pageSize, CancellationToken ct)
    {
        const string sql = """
            SELECT Code, Description, ParentATC
            FROM dbo.Cnas_ATC
            WHERE @Term IS NULL OR Code LIKE @Term OR Description LIKE @Term
            ORDER BY Code
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

            SELECT COUNT(*) FROM dbo.Cnas_ATC
            WHERE @Term IS NULL OR Code LIKE @Term OR Description LIKE @Term;
            """;

        var offset = (page - 1) * pageSize;
        var term = string.IsNullOrWhiteSpace(search) ? null : $"%{search}%";
        using var conn = context.CreateConnection();
        var multi = await conn.QueryMultipleAsync(new CommandDefinition(sql,
            new { Term = term, Offset = offset, PageSize = pageSize },
            cancellationToken: ct));

        var items = await multi.ReadAsync<CnasAtcCodeDto>();
        var total = await multi.ReadSingleAsync<int>();
        return new PagedResult<CnasAtcCodeDto>(items, total, page, pageSize);
    }

    public async Task<PagedResult<CnasIcd10Dto>> GetIcd10CodesPagedAsync(
        string? search, int page, int pageSize, CancellationToken ct)
    {
        const string sql = """
            SELECT Code, Name, DiseaseCategoryCode, ValidFrom, ValidTo, IsActive
            FROM dbo.Cnas_ICD10
            WHERE @Term IS NULL OR Code LIKE @Term OR Name LIKE @Term
            ORDER BY Code
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

            SELECT COUNT(*) FROM dbo.Cnas_ICD10
            WHERE @Term IS NULL OR Code LIKE @Term OR Name LIKE @Term;
            """;

        var offset = (page - 1) * pageSize;
        var term = string.IsNullOrWhiteSpace(search) ? null : $"%{search}%";
        using var conn = context.CreateConnection();
        var multi = await conn.QueryMultipleAsync(new CommandDefinition(sql,
            new { Term = term, Offset = offset, PageSize = pageSize },
            cancellationToken: ct));

        var items = await multi.ReadAsync<CnasIcd10Dto>();
        var total = await multi.ReadSingleAsync<int>();
        return new PagedResult<CnasIcd10Dto>(items, total, page, pageSize);
    }
}
