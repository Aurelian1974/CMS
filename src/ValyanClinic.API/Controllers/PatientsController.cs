using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.Patients.Commands.CreatePatient;
using ValyanClinic.Application.Features.Patients.Commands.UpdatePatient;
using ValyanClinic.Application.Features.Patients.Commands.DeletePatient;
using ValyanClinic.Application.Features.Patients.Queries.GetPatients;
using ValyanClinic.Application.Features.Patients.Queries.GetPatientById;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru gestionarea pacienților clinicii curente.
/// </summary>
public class PatientsController : BaseApiController
{
    /// <summary>Listare paginată pacienți cu filtre și statistici.</summary>
    [HttpGet]
    [HasAccess(ModuleCodes.Patients, AccessLevel.Read)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? genderId,
        [FromQuery] Guid? doctorId,
        [FromQuery] bool? hasAllergies,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "LastName",
        [FromQuery] string sortDir = "asc",
        CancellationToken ct = default)
    {
        var query = new GetPatientsQuery(
            search, genderId, doctorId, hasAllergies, isActive,
            page, pageSize, sortBy, sortDir);
        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }

    /// <summary>Obținere pacient complet după Id (date + alergii + doctori + contacte urgență).</summary>
    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Patients, AccessLevel.Read)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetPatientByIdQuery(id), ct);
        return HandleResult(result);
    }

    /// <summary>Creare pacient nou cu colecții opționale.</summary>
    [HttpPost]
    [HasAccess(ModuleCodes.Patients, AccessLevel.Write)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePatientCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizare pacient existent cu sincronizare colecții.</summary>
    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Patients, AccessLevel.Write)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdatePatientRequest request, CancellationToken ct)
    {
        var command = new UpdatePatientCommand(
            id,
            request.FirstName,
            request.LastName,
            request.Cnp,
            request.BirthDate,
            request.GenderId,
            request.BloodTypeId,
            request.PhoneNumber,
            request.SecondaryPhone,
            request.Email,
            request.Address,
            request.City,
            request.County,
            request.PostalCode,
            request.InsuranceNumber,
            request.InsuranceExpiry,
            request.IsInsured,
            request.ChronicDiseases,
            request.FamilyDoctorName,
            request.Notes,
            request.IsActive,
            request.Allergies,
            request.Doctors,
            request.EmergencyContacts);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Soft delete pacient.</summary>
    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Patients, AccessLevel.Full)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeletePatientCommand(id), ct);
        return HandleResult(result);
    }
}

// ===== Request model (separare de MediatR command — omite Id, vine din rută) =====

public sealed record UpdatePatientRequest(
    string FirstName,
    string LastName,
    string? Cnp,
    DateTime? BirthDate,
    Guid? GenderId,
    Guid? BloodTypeId,
    string? PhoneNumber,
    string? SecondaryPhone,
    string? Email,
    string? Address,
    string? City,
    string? County,
    string? PostalCode,
    string? InsuranceNumber,
    DateTime? InsuranceExpiry,
    bool IsInsured,
    string? ChronicDiseases,
    string? FamilyDoctorName,
    string? Notes,
    bool IsActive,
    List<SyncAllergyItem>? Allergies,
    List<SyncDoctorItem>? Doctors,
    List<SyncEmergencyContactItem>? EmergencyContacts);
