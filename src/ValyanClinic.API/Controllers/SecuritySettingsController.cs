using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Features.SecuritySettings.Commands.UpdateRoleSecuritySettings;
using ValyanClinic.Application.Features.SecuritySettings.Commands.UpdateSecuritySettings;
using ValyanClinic.Application.Features.SecuritySettings.DTOs;
using ValyanClinic.Application.Features.SecuritySettings.Queries.GetSecuritySettings;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Administrarea politicilor de securitate: parole, sesiuni per rol, praguri și retenție.
///
/// Valorile guvernează autentificarea întregii aplicații, de aceea modulul `settings`
/// e acordat doar rolului Admin, iar fiecare salvare ajunge în jurnalul de securitate
/// cu diferența exactă.
/// </summary>
public class SecuritySettingsController : BaseApiController
{
    /// <summary>
    /// Setările curente, împreună cu pragurile minime impuse în cod.
    ///
    /// Pragurile se trimit la client pentru ca formularul să dea feedback imediat cu
    /// aceleași valori pe care le impune serverul — altfel ar exista două adevăruri.
    /// </summary>
    [HttpGet]
    [HasAccess(ModuleCodes.Settings, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<SecuritySettingsViewDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSecuritySettingsQuery(), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Salvează setările globale. O valoare sub prag nu produce eroare: se aplică
    /// pragul, iar jurnalul înregistrează valoarea efectivă.
    /// </summary>
    [HttpPut]
    [HasAccess(ModuleCodes.Settings, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        [FromBody] UpdateSecuritySettingsCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Salvează setările de sesiune ale unui rol.</summary>
    [HttpPut("roles/{roleId:guid}")]
    [HasAccess(ModuleCodes.Settings, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateRole(
        Guid roleId, [FromBody] UpdateRoleSettingsRequest request, CancellationToken ct)
    {
        var command = new UpdateRoleSecuritySettingsCommand(
            roleId, request.IdleTimeoutMinutes, request.RefreshTokenDays);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }
}

/// <summary>Request body pentru setările de sesiune ale unui rol.</summary>
public sealed record UpdateRoleSettingsRequest(int IdleTimeoutMinutes, int RefreshTokenDays);
