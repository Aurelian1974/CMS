using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.ICD10.Commands.AddICD10Favorite;
using ValyanClinic.Application.Features.ICD10.Commands.RemoveICD10Favorite;
using ValyanClinic.Application.Features.ICD10.DTOs;
using ValyanClinic.Application.Features.ICD10.Queries.GetICD10Favorites;
using ValyanClinic.Application.Features.ICD10.Queries.SearchICD10;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>Controller pentru coduri ICD-10 — căutare și favorite.</summary>
[Microsoft.AspNetCore.Mvc.Route("api/v{version:apiVersion}/ICD10")]
public class ICD10Controller : BaseApiController
{
    private readonly ICurrentUser _currentUser;

    public ICD10Controller(ICurrentUser currentUser)
    {
        _currentUser = currentUser;
    }

    /// <summary>Caută coduri ICD-10 după text (min 2 caractere).</summary>
    [HttpGet("search")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IEnumerable<ICD10SearchResultDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string term,
        [FromQuery] int maxResults = 20,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(term) || term.Length < 2)
            return BadRequest(new ApiResponse<string>(false, null, "Termenul de căutare necesită minim 2 caractere.", null));

        var result = await Mediator.Send(new SearchICD10Query(term, maxResults), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează codurile ICD-10 favorite ale utilizatorului curent.</summary>
    [HttpGet("favorites")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IEnumerable<ICD10SearchResultDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFavorites(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetICD10FavoritesQuery(_currentUser.Id), ct);
        return HandleResult(result);
    }

    /// <summary>Adaugă un cod ICD-10 la favorite.</summary>
    [HttpPost("favorites/{icd10Id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> AddFavorite(Guid icd10Id, CancellationToken ct)
    {
        var result = await Mediator.Send(new AddICD10FavoriteCommand(icd10Id), ct);
        return HandleResult(result);
    }

    /// <summary>Elimină un cod ICD-10 din favorite.</summary>
    [HttpDelete("favorites/{icd10Id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveFavorite(Guid icd10Id, CancellationToken ct)
    {
        var result = await Mediator.Send(new RemoveICD10FavoriteCommand(icd10Id), ct);
        return HandleResult(result);
    }
}
