using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.Clinics.Commands.CreateClinicLocation;
using ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicLocation;
using ValyanClinic.Application.Features.Clinics.Commands.UpdateClinic;
using ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicLocation;
using ValyanClinic.Application.Features.Clinics.Queries.GetClinicLocations;
using ValyanClinic.Application.Features.Clinics.Queries.GetCurrentClinic;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru gestionarea clinicii curente (societate comercială) și a locațiilor sale.
/// Toate endpoint-urile operează pe ClinicId-ul din JWT (ICurrentUser).
/// </summary>
public class ClinicsController : BaseApiController
{
    // ==================== CLINICA CURENTĂ ====================

    /// <summary>Returnează datele clinicii curente (din JWT ClinicId).</summary>
    [HttpGet("current")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Read)]
    public async Task<IActionResult> GetCurrentClinic(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCurrentClinicQuery(), ct);
        return HandleResult(result);
    }

    /// <summary>Actualizează datele clinicii curente.</summary>
    [HttpPut("current")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpdateCurrentClinic(
        [FromBody] UpdateClinicCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    // ==================== LOCAȚII ====================

    /// <summary>Returnează locațiile clinicii curente. ?isActive=true/false pentru filtrare.</summary>
    [HttpGet("current/locations")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Read)]
    public async Task<IActionResult> GetLocations(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetClinicLocationsQuery(isActive), ct);
        return HandleResult(result);
    }

    /// <summary>Creează o locație nouă pentru clinica curentă.</summary>
    [HttpPost("current/locations")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> CreateLocation(
        [FromBody] CreateClinicLocationCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizează o locație existentă.</summary>
    [HttpPut("current/locations/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpdateLocation(
        Guid id, [FromBody] UpdateClinicLocationRequest request, CancellationToken ct)
    {
        var command = new UpdateClinicLocationCommand(
            id, request.Name, request.Address, request.City, request.County,
            request.PostalCode, request.PhoneNumber, request.Email, request.IsPrimary);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Șterge (soft delete) o locație.</summary>
    [HttpDelete("current/locations/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Full)]
    public async Task<IActionResult> DeleteLocation(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteClinicLocationCommand(id), ct);
        return HandleResult(result);
    }
}

// ===== Request models (separare de MediatR commands) =====

public sealed record UpdateClinicLocationRequest(
    string Name,
    string Address,
    string City,
    string County,
    string? PostalCode,
    string? PhoneNumber,
    string? Email,
    bool IsPrimary);
