using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Features.UserMenuPreferences.Commands.UpsertUserMenuPreferences;
using ValyanClinic.Application.Features.UserMenuPreferences.DTOs;
using ValyanClinic.Application.Features.UserMenuPreferences.Queries.GetUserMenuPreferences;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Preferințele sidebar-ului (favorite) ale utilizatorului curent. Autoservire —
/// fără gardă de modul, la fel ca schimbarea propriei parole: orice cont autentificat
/// își administrează propriul meniu, indiferent de rol.
/// </summary>
public class UserMenuPreferencesController : BaseApiController
{
    [HttpGet]
    [ProducesResponseType<ApiResponse<UserMenuPreferencesDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetUserMenuPreferencesQuery(), ct));

    [HttpPut]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Upsert(
        [FromBody] UpsertUserMenuPreferencesCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));
}
