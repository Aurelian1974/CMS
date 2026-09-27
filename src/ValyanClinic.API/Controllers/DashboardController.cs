using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Dashboard.DTOs;
using ValyanClinic.Application.Features.Dashboard.Queries.GetDashboard;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Dashboard-ul utilizatorului curent. [HasAccess(dashboard)] e poarta de intrare; fiecare
/// widget din răspuns a trecut în plus filtrul propriu de modul în handler.
/// </summary>
public class DashboardController : BaseApiController
{
    [HttpGet]
    [HasAccess(ModuleCodes.Dashboard, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<DashboardDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get([FromQuery] int trendDays = 30, CancellationToken ct = default)
        => HandleResult(await Mediator.Send(new GetDashboardQuery(trendDays), ct));
}
