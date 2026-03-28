using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.AuditLogs.Queries.GetAuditLogs;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru interogarea jurnalului de audit.
/// Necesită rolul de Administrator sau acces la modulul Audit.
/// </summary>
public class AuditLogsController : BaseApiController
{
    /// <summary>
    /// Listare paginată a jurnalului de audit cu filtre opționale.
    /// </summary>
    /// <param name="entityType">Tipul entității: Patient, User, Doctor, Appointment</param>
    /// <param name="entityId">Id-ul entității specifice (ex: id pacient)</param>
    /// <param name="action">Acțiunea: Create, Update, Delete</param>
    /// <param name="changedBy">Id-ul utilizatorului care a făcut modificarea</param>
    /// <param name="dateFrom">Data de început a intervalului</param>
    /// <param name="dateTo">Data de sfârșit a intervalului</param>
    /// <param name="page">Pagina curentă (default: 1)</param>
    /// <param name="pageSize">Număr înregistrări per pagină (default: 50, max recomandat: 100)</param>
    [HttpGet]
    [HasAccess(ModuleCodes.Audit, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<AuditLogPagedResult>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] string? entityType,
        [FromQuery] Guid? entityId,
        [FromQuery] string? action,
        [FromQuery] Guid? changedBy,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = new GetAuditLogsQuery(
            entityType, entityId, action, changedBy, dateFrom, dateTo, page, pageSize);
        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }
}
