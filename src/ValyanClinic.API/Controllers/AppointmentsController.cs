using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.Appointments.Commands.CreateAppointment;
using ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointment;
using ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointmentStatus;
using ValyanClinic.Application.Features.Appointments.Commands.DeleteAppointment;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointments;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentById;
using ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentsForScheduler;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru gestionarea programărilor clinicii curente.
/// </summary>
public class AppointmentsController : BaseApiController
{
    /// <summary>Listare paginată programări cu filtre și statistici.</summary>
    [HttpGet]
    [HasAccess(ModuleCodes.Appointments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<AppointmentsPagedResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? doctorId,
        [FromQuery] Guid? statusId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "StartTime",
        [FromQuery] string sortDir = "desc",
        CancellationToken ct = default)
    {
        var query = new GetAppointmentsQuery(
            search, doctorId, statusId, dateFrom, dateTo,
            page, pageSize, sortBy, sortDir);
        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }

    /// <summary>Obținere programare după Id.</summary>
    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Appointments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<AppointmentDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAppointmentByIdQuery(id), ct);
        return HandleResult(result);
    }

    /// <summary>Programări pentru vizualizarea scheduler.</summary>
    [HttpGet("scheduler")]
    [HasAccess(ModuleCodes.Appointments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IEnumerable<AppointmentSchedulerDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetForScheduler(
        [FromQuery] DateTime dateFrom,
        [FromQuery] DateTime dateTo,
        [FromQuery] Guid? doctorId,
        CancellationToken ct)
    {
        var query = new GetAppointmentsForSchedulerQuery(dateFrom, dateTo, doctorId);
        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }

    /// <summary>Creare programare nouă.</summary>
    [HttpPost]
    [HasAccess(ModuleCodes.Appointments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAppointmentCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizare programare existentă.</summary>
    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Appointments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateAppointmentRequest request, CancellationToken ct)
    {
        var command = new UpdateAppointmentCommand(
            id,
            request.PatientId,
            request.DoctorId,
            request.StartTime,
            request.EndTime,
            request.StatusId,
            request.Notes);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizare status programare.</summary>
    [HttpPatch("{id:guid}/status")]
    [HasAccess(ModuleCodes.Appointments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus(
        Guid id, [FromBody] UpdateAppointmentStatusRequest request, CancellationToken ct)
    {
        var command = new UpdateAppointmentStatusCommand(id, request.StatusId);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Soft delete programare.</summary>
    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Appointments, AccessLevel.Full)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAppointmentCommand(id), ct);
        return HandleResult(result);
    }
}

// ===== Request models (separare de MediatR command — omite Id, vine din rută) =====

public sealed record UpdateAppointmentRequest(
    Guid PatientId,
    Guid DoctorId,
    DateTime StartTime,
    DateTime EndTime,
    Guid? StatusId,
    string? Notes);

public sealed record UpdateAppointmentStatusRequest(Guid StatusId);
