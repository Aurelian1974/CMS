using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.Nomenclature.Commands.CreateMedicalTitle;
using ValyanClinic.Application.Features.Nomenclature.Commands.CreateSpecialty;
using ValyanClinic.Application.Features.Nomenclature.Commands.ToggleMedicalTitle;
using ValyanClinic.Application.Features.Nomenclature.Commands.ToggleSpecialty;
using ValyanClinic.Application.Features.Nomenclature.Commands.UpdateMedicalTitle;
using ValyanClinic.Application.Features.Nomenclature.Commands.UpdateSpecialty;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetMedicalTitles;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetCounties;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetLocalities;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetNomenclatureLookup;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialties;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialtyTree;

namespace ValyanClinic.API.Controllers;

/// <summary>Controller pentru nomenclatoare — specializări medicale.</summary>
public class NomenclatureController : BaseApiController
{
    // ==================== SPECIALITĂȚI ====================

    /// <summary>Returnează toate specializările (flat list). ?isActive=true/false pentru filtrare.</summary>
    [HttpGet("specialties")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
    public async Task<IActionResult> GetSpecialties(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSpecialtiesQuery(isActive), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează arborele ierarhic de specializări (categorii → specialități → subspecialități).</summary>
    [HttpGet("specialties/tree")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
    public async Task<IActionResult> GetSpecialtyTree(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSpecialtyTreeQuery(isActive), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează o specializare după Id.</summary>
    [HttpGet("specialties/{id:guid}")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
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
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Write)]
    public async Task<IActionResult> CreateSpecialty(
        [FromBody] CreateSpecialtyCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizează o specializare existentă.</summary>
    [HttpPut("specialties/{id:guid}")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Write)]
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
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Write)]
    public async Task<IActionResult> ToggleSpecialty(
        Guid id, [FromBody] ToggleSpecialtyRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new ToggleSpecialtyCommand(id, request.IsActive), ct);
        return HandleResult(result);
    }

    // ==================== TITULATURI MEDICALE ====================

    /// <summary>Returnează toate titularturile medicale. ?isActive=true/false pentru filtrare.</summary>
    [HttpGet("medical-titles")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
    public async Task<IActionResult> GetMedicalTitles(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMedicalTitlesQuery(isActive), ct);
        return HandleResult(result);
    }

    // ==================== NOMENCLATOARE SIMPLE (Lookups) ====================

    /// <summary>Returnează toate genurile (Masculin, Feminin, Nespecificat).</summary>
    [HttpGet("genders")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
    public async Task<IActionResult> GetGenders(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetNomenclatureLookupQuery(NomenclatureLookupType.Genders, isActive), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează toate grupele sanguine.</summary>
    [HttpGet("blood-types")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
    public async Task<IActionResult> GetBloodTypes(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetNomenclatureLookupQuery(NomenclatureLookupType.BloodTypes, isActive), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează toate tipurile de alergii.</summary>
    [HttpGet("allergy-types")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
    public async Task<IActionResult> GetAllergyTypes(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetNomenclatureLookupQuery(NomenclatureLookupType.AllergyTypes, isActive), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează toate județele active (pentru dropdown-uri geografice).</summary>
    [HttpGet("counties")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
    public async Task<IActionResult> GetCounties(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCountiesQuery(), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează localitățile unui județ (dependent dropdown).</summary>
    [HttpGet("localities")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
    public async Task<IActionResult> GetLocalities([FromQuery] Guid countyId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetLocalitiesQuery(countyId), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează toate severitățile alergiilor.</summary>
    [HttpGet("allergy-severities")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Read)]
    public async Task<IActionResult> GetAllergySeverities(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetNomenclatureLookupQuery(NomenclatureLookupType.AllergySeverities, isActive), ct);
        return HandleResult(result);
    }

    /// <summary>Creează o titulatură medicală nouă.</summary>
    [HttpPost("medical-titles")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Write)]
    public async Task<IActionResult> CreateMedicalTitle(
        [FromBody] CreateMedicalTitleCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizează o titulatură medicală existentă.</summary>
    [HttpPut("medical-titles/{id:guid}")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Write)]
    public async Task<IActionResult> UpdateMedicalTitle(
        Guid id, [FromBody] UpdateMedicalTitleRequest request, CancellationToken ct)
    {
        var command = new UpdateMedicalTitleCommand(
            id, request.Name, request.Code,
            request.Description, request.DisplayOrder);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Activează sau dezactivează o titulatură medicală.</summary>
    [HttpPatch("medical-titles/{id:guid}/toggle")]
    [HasAccess(ModuleCodes.Nomenclature, AccessLevel.Write)]
    public async Task<IActionResult> ToggleMedicalTitle(
        Guid id, [FromBody] ToggleMedicalTitleRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new ToggleMedicalTitleCommand(id, request.IsActive), ct);
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

public sealed record UpdateMedicalTitleRequest(
    string Name,
    string Code,
    string? Description,
    int DisplayOrder);

public sealed record ToggleMedicalTitleRequest(bool IsActive);
