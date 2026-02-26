using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.Departments.Commands.CreateDepartment;
using ValyanClinic.Application.Features.Departments.Commands.DeleteDepartment;
using ValyanClinic.Application.Features.Departments.Commands.UpdateDepartment;
using ValyanClinic.Application.Features.Departments.Queries.GetDepartmentById;
using ValyanClinic.Application.Features.Departments.Queries.GetDepartments;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru gestionarea departamentelor / secțiilor clinicii curente.
/// </summary>
public class DepartmentsController : BaseApiController
{
    /// <summary>Returnează departamentele clinicii. Filtre: ?isActive, ?locationId.</summary>
    [HttpGet]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Read)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool? isActive,
        [FromQuery] Guid? locationId,
        CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDepartmentsQuery(isActive, locationId), ct);
        return HandleResult(result);
    }

    /// <summary>Returnează un departament după Id.</summary>
    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Read)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDepartmentByIdQuery(id), ct);
        return HandleResult(result);
    }

    /// <summary>Creează un departament nou.</summary>
    [HttpPost]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> Create(
        [FromBody] CreateDepartmentCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizează un departament existent.</summary>
    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateDepartmentRequest request, CancellationToken ct)
    {
        var command = new UpdateDepartmentCommand(
            id, request.LocationId, request.Name, request.Code,
            request.Description, request.HeadDoctorId, request.IsActive);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Șterge (soft delete) un departament.</summary>
    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Full)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteDepartmentCommand(id), ct);
        return HandleResult(result);
    }
}

// ===== Request model (separare de MediatR command) =====

public sealed record UpdateDepartmentRequest(
    Guid LocationId,
    string Name,
    string Code,
    string? Description,
    Guid? HeadDoctorId,
    bool IsActive);
