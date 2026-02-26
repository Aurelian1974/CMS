using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.MedicalStaff.Commands.CreateMedicalStaff;
using ValyanClinic.Application.Features.MedicalStaff.Commands.DeleteMedicalStaff;
using ValyanClinic.Application.Features.MedicalStaff.Commands.UpdateMedicalStaff;
using ValyanClinic.Application.Features.MedicalStaff.Queries.GetMedicalStaffByClinic;
using ValyanClinic.Application.Features.MedicalStaff.Queries.GetMedicalStaffById;
using ValyanClinic.Application.Features.MedicalStaff.Queries.GetMedicalStaffList;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru gestionarea personalului medical (asistenți, infirmieri, moașe etc.).
/// </summary>
public class MedicalStaffController : BaseApiController
{
    /// <summary>Listare paginată personal medical cu filtre.</summary>
    [HttpGet]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? medicalTitleId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "LastName",
        [FromQuery] string sortDir = "asc",
        CancellationToken ct = default)
    {
        var query = new GetMedicalStaffListQuery(search, departmentId, medicalTitleId,
            isActive, page, pageSize, sortBy, sortDir);
        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }

    /// <summary>Listare simplificată personal medical (pentru dropdown-uri / departamente).</summary>
    [HttpGet("lookup")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetLookup(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMedicalStaffByClinicQuery(), ct);
        return HandleResult(result);
    }

    /// <summary>Obținere personal medical după Id.</summary>
    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMedicalStaffByIdQuery(id), ct);
        return HandleResult(result);
    }

    /// <summary>Creare membru personal medical nou.</summary>
    [HttpPost]
    [HasAccess(ModuleCodes.Users, AccessLevel.Write)]
    public async Task<IActionResult> Create(
        [FromBody] CreateMedicalStaffCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizare membru personal medical existent.</summary>
    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Write)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateMedicalStaffRequest request, CancellationToken ct)
    {
        var command = new UpdateMedicalStaffCommand(
            id,
            request.DepartmentId,
            request.SupervisorDoctorId,
            request.MedicalTitleId,
            request.FirstName,
            request.LastName,
            request.Email,
            request.PhoneNumber,
            request.IsActive);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Soft delete membru personal medical.</summary>
    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Full)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteMedicalStaffCommand(id), ct);
        return HandleResult(result);
    }
}

// ===== Request model (separare de MediatR command) =====

public sealed record UpdateMedicalStaffRequest(
    Guid? DepartmentId,
    Guid? SupervisorDoctorId,
    Guid? MedicalTitleId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    bool IsActive);
