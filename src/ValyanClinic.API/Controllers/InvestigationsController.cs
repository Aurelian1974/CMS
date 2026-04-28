using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Investigations.Commands.CreateInvestigation;
using ValyanClinic.Application.Features.Investigations.Commands.DeleteInvestigation;
using ValyanClinic.Application.Features.Investigations.Commands.UpdateInvestigation;
using ValyanClinic.Application.Features.Investigations.DTOs;
using ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationById;
using ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationsByConsultation;
using ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationsByPatient;
using ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationTrending;
using ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationTypes;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

public class InvestigationsController : BaseApiController
{
    [HttpGet("by-consultation/{consultationId:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<InvestigationDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByConsultation(Guid consultationId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetInvestigationsByConsultationQuery(consultationId), ct);
        return HandleResult(result);
    }

    [HttpGet("by-patient/{patientId:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<InvestigationDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByPatient(
        Guid patientId,
        [FromQuery] string? type,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        CancellationToken ct)
    {
        var result = await Mediator.Send(new GetInvestigationsByPatientQuery(patientId, type, dateFrom, dateTo), ct);
        return HandleResult(result);
    }

    [HttpGet("trending")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<InvestigationTrendingPointDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTrending(
        [FromQuery] Guid patientId,
        [FromQuery] string type,
        [FromQuery] string jsonPath,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        CancellationToken ct)
    {
        var result = await Mediator.Send(new GetInvestigationTrendingQuery(patientId, type, jsonPath, dateFrom, dateTo), ct);
        return HandleResult(result);
    }

    [HttpGet("types")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<InvestigationTypeDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTypes([FromQuery] string? specialty, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetInvestigationTypesQuery(specialty), ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<InvestigationDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetInvestigationByIdQuery(id), ct);
        return HandleResult(result);
    }

    [HttpPost]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateInvestigationCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInvestigationRequest request, CancellationToken ct)
    {
        var command = new UpdateInvestigationCommand(
            id,
            request.InvestigationDate,
            request.StructuredData,
            request.Narrative,
            request.IsExternal,
            request.ExternalSource,
            request.Status,
            request.AttachedDocumentId,
            request.HasStructuredData,
            request.InvestigationType);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteInvestigationCommand(id), ct);
        return HandleResult(result);
    }
}

public sealed record UpdateInvestigationRequest(
    string InvestigationType,
    DateTime InvestigationDate,
    string? StructuredData,
    string? Narrative,
    bool IsExternal,
    string? ExternalSource,
    byte Status,
    Guid? AttachedDocumentId,
    bool HasStructuredData);
