using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.RecommendedAnalyses.Commands.CreateRecommendedAnalysis;
using ValyanClinic.Application.Features.RecommendedAnalyses.Commands.DeleteRecommendedAnalysis;
using ValyanClinic.Application.Features.RecommendedAnalyses.Commands.UpdateRecommendedAnalysis;
using ValyanClinic.Application.Features.RecommendedAnalyses.DTOs;
using ValyanClinic.Application.Features.RecommendedAnalyses.Queries.GetRecommendedAnalysesByConsultation;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

public class RecommendedAnalysesController : BaseApiController
{
    [HttpGet("by-consultation/{consultationId:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<RecommendedAnalysisDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByConsultation(Guid consultationId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRecommendedAnalysesByConsultationQuery(consultationId), ct);
        return HandleResult(result);
    }

    [HttpPost]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateRecommendedAnalysisCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRecommendedAnalysisRequest request, CancellationToken ct)
    {
        var command = new UpdateRecommendedAnalysisCommand(id, request.Priority, request.Notes, request.Status);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteRecommendedAnalysisCommand(id), ct);
        return HandleResult(result);
    }
}

public sealed record UpdateRecommendedAnalysisRequest(byte Priority, string? Notes, byte Status);
