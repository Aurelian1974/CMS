using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.RecommendedAnalyses.DTOs;
using ValyanClinic.Application.Features.RecommendedAnalyses.Queries.SearchAnalyses;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

public class AnalysesController : BaseApiController
{
    /// <summary>Typeahead pentru analize din dicționarul Synevo (~2200 intrări).</summary>
    [HttpGet("search")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<AnalysisDictionaryDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int top = 50, CancellationToken ct = default)
    {
        var result = await Mediator.Send(new SearchAnalysesQuery(q, top), ct);
        return HandleResult(result);
    }
}
