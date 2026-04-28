using MediatR;
using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Lab.Commands.ParseLabPdf;
using ValyanClinic.Application.Features.Lab.DTOs;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

public class LabController : BaseApiController
{
    /// <summary>
    /// Parsează un PDF de buletin de analize medicale și returnează datele structurate
    /// (FĂRĂ a salva). Front-end-ul va edita rezultatele și va salva apoi prin
    /// endpoint-ul de Investigations cu InvestigationType='LabResults'.
    /// </summary>
    [HttpPost("parse")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [RequestSizeLimit(20_000_000)]   // 20 MB
    [ProducesResponseType<ApiResponse<LabParseResultDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Parse(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new ApiResponse<LabParseResultDto>(false, default, "Fișier invalid sau lipsă.", null));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".pdf")
            return BadRequest(new ApiResponse<LabParseResultDto>(false, default, "Sunt acceptate doar fișiere PDF.", null));

        await using var stream = file.OpenReadStream();
        var result = await Mediator.Send(new ParseLabPdfCommand(stream, file.FileName), ct);
        return HandleResult(result);
    }
}
