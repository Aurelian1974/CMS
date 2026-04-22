using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.Commands.CreateConsultation;
using ValyanClinic.Application.Features.Consultations.Commands.DeleteConsultation;
using ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultation;
using ValyanClinic.Application.Features.Consultations.DTOs;
using ValyanClinic.Application.Features.Consultations.Queries.GetConsultationById;
using ValyanClinic.Application.Features.Consultations.Queries.GetConsultationByAppointmentId;
using ValyanClinic.Application.Features.Consultations.Queries.GetConsultations;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

public class ConsultationsController : BaseApiController
{
    [HttpGet]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<ConsultationsPagedResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? doctorId,
        [FromQuery] Guid? statusId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "Date",
        [FromQuery] string sortDir = "desc",
        CancellationToken ct = default)
    {
        var query = new GetConsultationsQuery(
            search, doctorId, statusId, dateFrom, dateTo,
            page, pageSize, sortBy, sortDir);
        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<ConsultationDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetConsultationByIdQuery(id), ct);
        return HandleResult(result);
    }

    [HttpGet("by-appointment/{appointmentId:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<ConsultationDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByAppointmentId(Guid appointmentId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetConsultationByAppointmentIdQuery(appointmentId), ct);
        return HandleResult(result);
    }

    [HttpPost]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateConsultationCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateConsultationRequest request, CancellationToken ct)
    {
        var command = new UpdateConsultationCommand(
            id,
            request.PatientId,
            request.DoctorId,
            request.AppointmentId,
            request.Date,
            request.Motiv,
            request.IstoricMedicalPersonal,
            request.TratamentAnterior,
            request.IstoricBoalaActuala,
            request.IstoricFamilial,
            request.FactoriDeRisc,
            request.AlergiiConsultatie,
            request.StareGenerala,
            request.Tegumente,
            request.Mucoase,
            request.Greutate,
            request.Inaltime,
            request.TensiuneSistolica,
            request.TensiuneDiastolica,
            request.Puls,
            request.FrecventaRespiratorie,
            request.Temperatura,
            request.SpO2,
            request.Edeme,
            request.Glicemie,
            request.GanglioniLimfatici,
            request.ExamenClinic,
            request.AlteObservatiiClinice,
            request.Investigatii,
            request.AnalizeMedicale,
            request.Diagnostic,
            request.DiagnosticCodes,
            request.Recomandari,
            request.Observatii,
            request.Concluzii,
            request.EsteAfectiuneOncologica,
            request.AreIndicatieInternare,
            request.SaEliberatPrescriptie,
            request.SeriePrescriptie,
            request.SaEliberatConcediuMedical,
            request.SerieConcediuMedical,
            request.SaEliberatIngrijiriDomiciliu,
            request.SaEliberatDispozitiveMedicale,
            request.DataUrmatoareiVizite,
            request.NoteUrmatoareaVizita,
            request.StatusId);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Full)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteConsultationCommand(id), ct);
        return HandleResult(result);
    }
}

public sealed record UpdateConsultationRequest(
    Guid PatientId,
    Guid DoctorId,
    Guid? AppointmentId,
    DateTime Date,
    // Tab 1: Anamneză
    string? Motiv,
    string? IstoricMedicalPersonal,
    string? TratamentAnterior,
    string? IstoricBoalaActuala,
    string? IstoricFamilial,
    string? FactoriDeRisc,
    string? AlergiiConsultatie,
    // Tab 2: Examen Clinic
    string? StareGenerala,
    string? Tegumente,
    string? Mucoase,
    decimal? Greutate,
    int? Inaltime,
    int? TensiuneSistolica,
    int? TensiuneDiastolica,
    int? Puls,
    int? FrecventaRespiratorie,
    decimal? Temperatura,
    int? SpO2,
    string? Edeme,
    decimal? Glicemie,
    string? GanglioniLimfatici,
    string? ExamenClinic,
    string? AlteObservatiiClinice,
    // Tab 3: Investigații
    string? Investigatii,
    // Tab 4: Analize Medicale
    string? AnalizeMedicale,
    // Tab 5: Diagnostic & Tratament
    string? Diagnostic,
    string? DiagnosticCodes,
    string? Recomandari,
    string? Observatii,
    // Tab 6: Concluzii
    string? Concluzii,
    bool EsteAfectiuneOncologica,
    bool AreIndicatieInternare,
    bool SaEliberatPrescriptie,
    string? SeriePrescriptie,
    bool SaEliberatConcediuMedical,
    string? SerieConcediuMedical,
    bool SaEliberatIngrijiriDomiciliu,
    bool SaEliberatDispozitiveMedicale,
    DateTime? DataUrmatoareiVizite,
    string? NoteUrmatoareaVizita,
    Guid? StatusId);
