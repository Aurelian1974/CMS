using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Features.SecurityEvents.DTOs;
using ValyanClinic.Application.Features.SecurityEvents.Queries.GetSecurityEvents;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Interogarea jurnalului de evenimente de autentificare.
///
/// Fără acest endpoint jurnalul ar fi write-only: s-ar scrie corect, dar nu ar
/// putea fi produs la o cerere GDPR sau folosit într-o investigație.
/// </summary>
public class SecurityEventsController : BaseApiController
{
    /// <summary>Listare paginată a evenimentelor de securitate, cu filtre opționale.</summary>
    /// <param name="eventType">LoginSucceeded, LoginFailed, AccountLocked, TokenReuseDetected etc.</param>
    /// <param name="userId">Istoricul unui utilizator anume</param>
    /// <param name="emailAttempted">Căutare parțială după adresa încercată la login</param>
    /// <param name="ipAddress">Corelarea încercărilor de la aceeași adresă</param>
    /// <param name="succeeded">Doar reușite sau doar eșuate</param>
    /// <param name="dateFrom">Începutul intervalului</param>
    /// <param name="dateTo">Sfârșitul intervalului</param>
    /// <param name="page">Pagina (implicit 1)</param>
    /// <param name="pageSize">Înregistrări per pagină (implicit 50, maxim 200)</param>
    [HttpGet]
    [HasAccess(ModuleCodes.Audit, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<SecurityEventPagedResult>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] string? eventType,
        [FromQuery] Guid? userId,
        [FromQuery] string? emailAttempted,
        [FromQuery] string? ipAddress,
        [FromQuery] bool? succeeded,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = new GetSecurityEventsQuery(
            eventType, userId, emailAttempted, ipAddress, succeeded,
            dateFrom, dateTo, page, pageSize);

        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }
}
