using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.Schedule.Queries;
using ValyanClinic.Application.Features.Schedule.Commands;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Gestionare program clinic și program individual al medicilor.
/// </summary>
[Route("api/schedule")]
public class ScheduleController : BaseApiController
{
    // ── Program clinică ───────────────────────────────────────────────────────

    [HttpGet("clinic")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Read)]
    public async Task<IActionResult> GetClinicSchedule(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetClinicScheduleQuery(), ct);
        return HandleResult(result);
    }

    [HttpPut("clinic/day")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpsertClinicDay(
        [FromBody] UpsertClinicDayCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    // ── Program medici (vedere globală) ──────────────────────────────────────

    [HttpGet("doctors")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Read)]
    public async Task<IActionResult> GetDoctorScheduleByClinic(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDoctorScheduleByClinicQuery(), ct);
        return HandleResult(result);
    }

    // ── Program medic individual ──────────────────────────────────────────────

    [HttpGet("doctors/{doctorId:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Read)]
    public async Task<IActionResult> GetDoctorSchedule(Guid doctorId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDoctorScheduleQuery(doctorId), ct);
        return HandleResult(result);
    }

    [HttpPut("doctors/{doctorId:guid}/day")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpsertDoctorDay(
        Guid doctorId, [FromBody] UpsertDoctorDayRequest request, CancellationToken ct)
    {
        var command = new UpsertDoctorDayCommand(doctorId, request.DayOfWeek, request.StartTime, request.EndTime);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("doctors/{doctorId:guid}/day/{dayOfWeek:int}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> DeleteDoctorDay(Guid doctorId, byte dayOfWeek, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteDoctorDayCommand(doctorId, dayOfWeek), ct);
        return HandleResult(result);
    }
}

// ── Request bodies ────────────────────────────────────────────────────────────

public sealed record UpsertDoctorDayRequest(byte DayOfWeek, string StartTime, string EndTime);
