using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.Commands.CreateAnalysesResult;
using ValyanClinic.Application.Features.AnalysesResults.Commands.DeleteAnalysesResult;
using ValyanClinic.Application.Features.AnalysesResults.Commands.UpdateAnalysesResult;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;
using ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultById;
using ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultsByConsultation;
using ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultsByPatient;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

public class AnalysesResultsController : BaseApiController
{
    [HttpGet("by-consultation/{consultationId:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<AnalysesResultListDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByConsultation(Guid consultationId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAnalysesResultsByConsultationQuery(consultationId), ct);
        return HandleResult(result);
    }

    [HttpGet("by-patient/{patientId:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<AnalysesResultsByPatientResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByPatient(
        Guid patientId,
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAnalysesResultsByPatientQuery(patientId, dateFrom, dateTo), ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<AnalysesResultDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAnalysesResultByIdQuery(id), ct);
        return HandleResult(result);
    }

    [HttpPost]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateAnalysesResultCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAnalysesResultRequest request, CancellationToken ct)
    {
        var command = new UpdateAnalysesResultCommand(
            id,
            request.Laboratory,
            request.BulletinNumber,
            request.CollectionDate,
            request.ResultDate,
            request.DoctorName,
            request.Details);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Full)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAnalysesResultCommand(id), ct);
        return HandleResult(result);
    }
}

/// <summary>Body pentru PUT — fara Id (vine din route) si fara PatientId (nu se modifica).</summary>
public sealed record UpdateAnalysesResultRequest(
    string? Laboratory,
    string? BulletinNumber,
    DateOnly CollectionDate,
    DateOnly? ResultDate,
    string? DoctorName,
    IReadOnlyList<AnalysesResultDetailInput> Details);
