using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Features.Nomenclature.Commands.CreateSpecialty;
using ValyanClinic.Application.Features.Nomenclature.Commands.ToggleSpecialty;
using ValyanClinic.Application.Features.Nomenclature.Commands.UpdateSpecialty;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialties;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialtyTree;

namespace ValyanClinic.API.Controllers;

/// <summary>Controller pentru nomenclatoare — specializări medicale.</summary>
public class NomenclatureController : BaseApiController
{
    // ==================== SPECIALITĂȚI ====================

    /// <summary>Returnează toate specializările (flat list). ?isActive=true/false pentru filtrare.</summary>
    [AllowAnonymous]
    [HttpGet("specialties")]
    public async Task<IActionResult> GetSpecialties(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSpecialtiesQuery(isActive), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează arborele ierarhic de specializări (categorii → specialități → subspecialități).</summary>
    [AllowAnonymous]
    [HttpGet("specialties/tree")]
    public async Task<IActionResult> GetSpecialtyTree(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSpecialtyTreeQuery(isActive), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează o specializare după Id.</summary>
    [AllowAnonymous]
    [HttpGet("specialties/{id:guid}")]
    public async Task<IActionResult> GetSpecialtyById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSpecialtiesQuery(), ct);
        if (!result.IsSuccess) return HandleResult(result);

        var specialty = result.Value?.FirstOrDefault(s => s.Id == id);
        if (specialty is null)
            return NotFound(new { success = false, message = "Specializarea nu a fost găsită." });

        return Ok(new { success = true, data = specialty });
    }

    /// <summary>Creează o specializare nouă.</summary>
    [HttpPost("specialties")]
    public async Task<IActionResult> CreateSpecialty(
        [FromBody] CreateSpecialtyCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizează o specializare existentă.</summary>
    [HttpPut("specialties/{id:guid}")]
    public async Task<IActionResult> UpdateSpecialty(
        Guid id, [FromBody] UpdateSpecialtyRequest request, CancellationToken ct)
    {
        var command = new UpdateSpecialtyCommand(
            id, request.ParentId, request.Name, request.Code,
            request.Description, request.DisplayOrder, request.Level);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Activează sau dezactivează o specializare.</summary>
    [HttpPatch("specialties/{id:guid}/toggle")]
    public async Task<IActionResult> ToggleSpecialty(
        Guid id, [FromBody] ToggleSpecialtyRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new ToggleSpecialtyCommand(id, request.IsActive), ct);
        return HandleResult(result);
    }
}

// ===== Request models (separare de MediatR commands) =====

public sealed record UpdateSpecialtyRequest(
    Guid? ParentId,
    string Name,
    string Code,
    string? Description,
    int DisplayOrder,
    byte Level);

public sealed record ToggleSpecialtyRequest(bool IsActive);
