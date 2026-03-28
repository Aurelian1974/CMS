using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Features.Cnas.Commands.TriggerSync;
using ValyanClinic.Application.Features.Cnas.Queries.GetActiveSubstancesPaged;
using ValyanClinic.Application.Features.Cnas.Queries.GetAtcCodesPaged;
using ValyanClinic.Application.Features.Cnas.Queries.GetCompensatedDrugsPaged;
using ValyanClinic.Application.Features.Cnas.Queries.GetCurrentStats;
using ValyanClinic.Application.Features.Cnas.Queries.GetDrugsPaged;
using ValyanClinic.Application.Features.Cnas.Queries.GetIcd10CodesPaged;
using ValyanClinic.Application.Features.Cnas.Queries.GetSyncHistory;
using ValyanClinic.Application.Features.Cnas.Queries.GetSyncStatus;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru sincronizarea și interogarea nomenclatoarelor CNAS (farmacii).
/// </summary>
[Route("api/v{version:apiVersion}/cnas")]
public class CnasController : BaseApiController
{
    /// <summary>
    /// Declanșează manual o sincronizare CNAS. Returnează imediat JobId-ul —
    /// sincronizarea rulează în background.
    /// </summary>
    [HttpPost("sync")]
    [HasAccess(ModuleCodes.Cnas, AccessLevel.Write)]
    public async Task<IActionResult> TriggerSync(CancellationToken ct)
    {
        var result = await Mediator.Send(new TriggerCnasSyncCommand(), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Returnează statusul curent al unui job de sincronizare CNAS.
    /// Polling endpoint — clientul apelează periodic până la Status = "Success" sau "Failed".
    /// </summary>
    [HttpGet("sync/{jobId:guid}")]
    [HasAccess(ModuleCodes.Cnas, AccessLevel.Read)]
    public async Task<IActionResult> GetSyncStatus(Guid jobId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCnasSyncStatusQuery(jobId), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Returnează istoricul ultimelor sincronizări CNAS (implicit ultimele 10).
    /// </summary>
    [HttpGet("sync/history")]
    [HasAccess(ModuleCodes.Cnas, AccessLevel.Read)]
    public async Task<IActionResult> GetSyncHistory([FromQuery] int count = 10, CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetCnasSyncHistoryQuery(count), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Returnează statistici curente: număr medicamente, ultima sincronizare, versiune nomenclator.
    /// </summary>
    [HttpGet("stats")]
    [HasAccess(ModuleCodes.Cnas, AccessLevel.Read)]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCnasCurrentStatsQuery(), ct);
        return HandleResult(result);
    }

    // ── Nomenclator — listare paginată ──────────────────────────────────────────

    /// <summary>
    /// Listare paginată medicamente CNAS. Suportă căutare după nume, cod, substanță activă.
    /// </summary>
    [HttpGet("drugs")]
    [HasAccess(ModuleCodes.Cnas, AccessLevel.Read)]
    public async Task<IActionResult> GetDrugs(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] bool? isCompensated,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(
            new GetCnasDrugsPagedQuery(search, isActive, isCompensated, page, pageSize), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Listare paginată medicamente compensate (liste A/B/C/D). Suportă filtrare după tip listă.
    /// </summary>
    [HttpGet("compensated")]
    [HasAccess(ModuleCodes.Cnas, AccessLevel.Read)]
    public async Task<IActionResult> GetCompensated(
        [FromQuery] string? search,
        [FromQuery] string? listType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(
            new GetCnasCompensatedDrugsPagedQuery(search, listType, page, pageSize), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Listare paginată substanțe active CNAS.
    /// </summary>
    [HttpGet("active-substances")]
    [HasAccess(ModuleCodes.Cnas, AccessLevel.Read)]
    public async Task<IActionResult> GetActiveSubstances(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(
            new GetCnasActiveSubstancesPagedQuery(search, page, pageSize), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Listare paginată coduri ATC.
    /// </summary>
    [HttpGet("atc")]
    [HasAccess(ModuleCodes.Cnas, AccessLevel.Read)]
    public async Task<IActionResult> GetAtcCodes(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(
            new GetCnasAtcCodesPagedQuery(search, page, pageSize), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Listare paginată diagnostice ICD-10 utilizate de CNAS în compensări.
    /// </summary>
    [HttpGet("icd10")]
    [HasAccess(ModuleCodes.Cnas, AccessLevel.Read)]
    public async Task<IActionResult> GetIcd10Codes(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(
            new GetCnasIcd10CodesPagedQuery(search, page, pageSize), ct);
        return HandleResult(result);
    }
}
