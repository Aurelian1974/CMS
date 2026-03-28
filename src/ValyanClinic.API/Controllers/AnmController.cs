using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Features.Anm.Commands.TriggerSync;
using ValyanClinic.Application.Features.Anm.DTOs;
using ValyanClinic.Application.Features.Anm.Queries.GetCurrentStats;
using ValyanClinic.Application.Features.Anm.Queries.GetDrugsPaged;
using ValyanClinic.Application.Features.Anm.Queries.GetSyncHistory;
using ValyanClinic.Application.Features.Anm.Queries.GetSyncStatus;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru sincronizarea și interogarea nomenclatorului ANM
/// (Agenția Națională a Medicamentului și a Dispozitivelor Medicale).
/// Sursa datelor: https://nomenclator.anm.ro/files/nomenclator.xlsx
/// </summary>
[Route("api/v{version:apiVersion}/anm")]
public class AnmController : BaseApiController
{
    // ── Trigger / Status / History / Stats ──────────────────────────────────

    /// <summary>
    /// Declanșează manual o sincronizare ANM. Returnează imediat JobId-ul —
    /// descărcarea și importul Excel rulează în background.
    /// </summary>
    [HttpPost("sync")]
    [HasAccess(ModuleCodes.Anm, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> TriggerSync(CancellationToken ct)
    {
        var result = await Mediator.Send(new TriggerAnmSyncCommand(), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Returnează statusul unui job de sincronizare ANM.
    /// Polling endpoint — apelați periodic până la Status = "Success" sau "Failed".
    /// </summary>
    [HttpGet("sync/{jobId:guid}")]
    [HasAccess(ModuleCodes.Anm, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<AnmSyncStatusDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSyncStatus(Guid jobId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAnmSyncStatusQuery(jobId), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Returnează istoricul ultimelor sincronizări ANM (implicit ultimele 10).
    /// </summary>
    [HttpGet("sync/history")]
    [HasAccess(ModuleCodes.Anm, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IEnumerable<AnmSyncHistoryDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSyncHistory([FromQuery] int count = 10, CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetAnmSyncHistoryQuery(count), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Returnează statistici curente: număr medicamente, ultima sincronizare, status.
    /// </summary>
    [HttpGet("stats")]
    [HasAccess(ModuleCodes.Anm, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<AnmSyncStatsDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAnmCurrentStatsQuery(), ct);
        return HandleResult(result);
    }

    // ── Nomenclator — listare paginată ───────────────────────────────────────

    /// <summary>
    /// Listare paginată medicamente ANM. Suportă căutare după denumire comercială,
    /// substanță activă (DCI/INN) sau cod de autorizare.
    /// </summary>
    [HttpGet("drugs")]
    [HasAccess(ModuleCodes.Anm, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<PagedResult<AnmDrugDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDrugs(
        [FromQuery] string? search,
        [FromQuery] bool?   isActive,
        [FromQuery] bool?   isCompensated,
        [FromQuery] int     page = 1,
        [FromQuery] int     pageSize = 20,
        CancellationToken   ct = default)
    {
        var result = await Mediator.Send(new GetAnmDrugsPagedQuery(search, isActive, isCompensated, page, pageSize), ct);
        return HandleResult(result);
    }
}
