using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.Doctors.Commands.CreateDoctor;
using ValyanClinic.Application.Features.Doctors.Commands.DeleteDoctor;
using ValyanClinic.Application.Features.Doctors.Commands.UpdateDoctor;
using ValyanClinic.Application.Features.Doctors.Queries.GetDoctorById;
using ValyanClinic.Application.Features.Doctors.Queries.GetDoctors;
using ValyanClinic.Application.Features.Doctors.Queries.GetDoctorsByClinic;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru gestionarea doctorilor clinicii curente.
/// </summary>
public class DoctorsController : BaseApiController
{
    /// <summary>Listare paginată doctori cu filtre.</summary>
    [HttpGet]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? specialtyId,
        [FromQuery] Guid? departmentId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "LastName",
        [FromQuery] string sortDir = "asc",
        CancellationToken ct = default)
    {
        var query = new GetDoctorsQuery(search, specialtyId, departmentId, isActive,
            page, pageSize, sortBy, sortDir);
        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }

    /// <summary>Obținere doctor după Id.</summary>
    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDoctorByIdQuery(id), ct);
        return HandleResult(result);
    }

    /// <summary>Listare simplificată doctori (pentru dropdown-uri).</summary>
    [HttpGet("lookup")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetLookup(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDoctorsByClinicQuery(), ct);
        return HandleResult(result);
    }

    /// <summary>Creare doctor nou.</summary>
    [HttpPost]
    [HasAccess(ModuleCodes.Users, AccessLevel.Write)]
    public async Task<IActionResult> Create(
        [FromBody] CreateDoctorCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizare doctor existent.</summary>
    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Write)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateDoctorRequest request, CancellationToken ct)
    {
        var command = new UpdateDoctorCommand(
            id,
            request.DepartmentId,
            request.SupervisorDoctorId,
            request.SpecialtyId,
            request.SubspecialtyId,
            request.MedicalTitleId,
            request.FirstName,
            request.LastName,
            request.Email,
            request.PhoneNumber,
            request.MedicalCode,
            request.LicenseNumber,
            request.LicenseExpiresAt,
            request.IsActive);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Soft delete doctor.</summary>
    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Full)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteDoctorCommand(id), ct);
        return HandleResult(result);
    }
}

// ===== Request model (separare de MediatR command) =====

public sealed record UpdateDoctorRequest(
    Guid? DepartmentId,
    Guid? SupervisorDoctorId,
    Guid? SpecialtyId,
    Guid? SubspecialtyId,
    Guid? MedicalTitleId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    string? MedicalCode,
    string? LicenseNumber,
    DateTime? LicenseExpiresAt,
    bool IsActive);
