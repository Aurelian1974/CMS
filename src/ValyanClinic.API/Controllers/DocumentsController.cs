using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Investigations.DTOs;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Endpoints minimal pentru upload și download de documente atașate (in-DB storage).
/// Limită upload: 10 MB.
/// </summary>
public class DocumentsController(IDocumentRepository documents, ICurrentUser currentUser) : BaseApiController
{
    private const long MaxUploadBytes = 10 * 1024 * 1024;

    [HttpPost("upload")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [RequestSizeLimit(MaxUploadBytes)]
    [ProducesResponseType<ApiResponse<DocumentDto>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return HandleResult(Result<DocumentDto>.Failure("Fișierul este gol sau lipsă."));
        if (file.Length > MaxUploadBytes)
            return HandleResult(Result<DocumentDto>.Failure("Fișierul depășește 10 MB."));

        await using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);

        var id = await documents.CreateAsync(
            currentUser.ClinicId,
            file.FileName,
            file.ContentType ?? "application/octet-stream",
            file.Length,
            storagePath: null,
            fileBytes: ms.ToArray(),
            createdBy: currentUser.Id,
            ct);

        var dto = new DocumentDto
        {
            Id = id,
            FileName = file.FileName,
            ContentType = file.ContentType ?? "application/octet-stream",
            FileSize = file.Length,
        };
        return HandleResult(Result<DocumentDto>.Created(dto));
    }

    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    public async Task<IActionResult> Download(Guid id, CancellationToken ct)
    {
        var doc = await documents.GetByIdAsync(id, currentUser.ClinicId, ct);
        if (doc is null) return NotFound();
        if (doc.FileBytes is null || doc.FileBytes.Length == 0)
            return NotFound("Documentul nu are bytes stocați.");
        return File(doc.FileBytes, doc.ContentType, doc.FileName);
    }
}
