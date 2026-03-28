using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Anm.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Repository pentru gestionarea log-urilor de sincronizare ANM și interogarea nomenclatorului.</summary>
public interface IAnmSyncRepository
{
    // ── Sync log ──────────────────────────────────────────────────────────────
    Task<Guid> CreateSyncLogAsync(string triggeredBy, CancellationToken ct);
    Task UpdateSyncLogAsync(AnmSyncLogUpdateDto dto, CancellationToken ct);
    Task<AnmSyncStatusDto?> GetSyncStatusAsync(Guid logId, CancellationToken ct);
    Task<IEnumerable<AnmSyncHistoryDto>> GetSyncHistoryAsync(int count, CancellationToken ct);
    Task<AnmSyncStatsDto> GetCurrentStatsAsync(CancellationToken ct);

    // ── Nomenclator — citire paginată ─────────────────────────────────────────
    Task<PagedResult<AnmDrugDto>> GetDrugsPagedAsync(
        string? search, bool? isActive, bool? isCompensated, int page, int pageSize, CancellationToken ct);
}
