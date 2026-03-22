using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Cnas.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface ICnasSyncRepository
{
    // Sync log
    Task<Guid> CreateSyncLogAsync(string triggeredBy, CancellationToken ct);
    Task UpdateSyncLogAsync(CnasSyncLogUpdateDto dto, CancellationToken ct);
    Task<CnasSyncStatusDto?> GetSyncStatusAsync(Guid logId, CancellationToken ct);
    Task<IEnumerable<CnasSyncHistoryDto>> GetSyncHistoryAsync(int count, CancellationToken ct);
    Task<CnasSyncStatsDto> GetCurrentStatsAsync(CancellationToken ct);

    // Nomenclator — citire paginată
    Task<PagedResult<CnasDrugDto>> GetDrugsPagedAsync(string? search, bool? isActive, bool? isCompensated, int page, int pageSize, CancellationToken ct);
    Task<PagedResult<CnasCompensatedDrugDto>> GetCompensatedDrugsPagedAsync(string? search, string? listType, int page, int pageSize, CancellationToken ct);
    Task<PagedResult<CnasActiveSubstanceDto>> GetActiveSubstancesPagedAsync(string? search, int page, int pageSize, CancellationToken ct);
    Task<PagedResult<CnasAtcCodeDto>> GetAtcCodesPagedAsync(string? search, int page, int pageSize, CancellationToken ct);
    Task<PagedResult<CnasIcd10Dto>> GetIcd10CodesPagedAsync(string? search, int page, int pageSize, CancellationToken ct);
}
