using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Investigations.DTOs;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Upload și download pentru atașamentele investigațiilor din consultație (in-DB storage).
/// Limită upload: 10 MB.
///
/// GARDA E PE `consultations`, NU PE `documents` — INTENȚIONAT.
/// dbo.Documents a fost creat în migrarea 0036 ca depozit de atașamente pentru
/// ConsultationInvestigations.AttachedDocumentId. Un fișier de aici e conținut clinic:
/// un buletin de spirometrie, un EKG, o radiografie atașate unei investigații. Singurul
/// consumator din client e DocumentUpload.tsx, sub features/consultations/investigations/.
///
/// Modulul `documents` seed-uit în 0011 („Trimiteri, scrisori medicale, concedii") era
/// pentru un feature diferit, care nu s-a construit; a fost retras în migrarea 0057.
///
/// Mutarea acestui controller pe ModuleCodes.Documents ar fi fost o regresie de
/// securitate, nu o aliniere:
///   - recepția (consultations = None, documents = Write) ar fi CÂȘTIGAT acces la
///     atașamente clinice;
///   - asistenta (consultations = Read, documents = None) ar fi PIERDUT accesul de
///     citire pe care îl are azi.
/// Dacă apare vreodată feature-ul de trimiteri/scrisori/concedii, el primește
/// controller-ul lui și modulul reactivat — acesta rămâne unde e.
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
