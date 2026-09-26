using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.Commands.CancelPrescription;
using ValyanClinic.Application.Features.Prescriptions.Commands.CreatePrescriptions;
using ValyanClinic.Application.Features.Prescriptions.Commands.DeletePrescription;
using ValyanClinic.Application.Features.Prescriptions.Commands.GenerateConsultationPrescriptions;
using ValyanClinic.Application.Features.Prescriptions.Commands.IssuePrescription;
using ValyanClinic.Application.Features.Prescriptions.Commands.TransmitPrescription;
using ValyanClinic.Application.Features.Prescriptions.Commands.UpdatePrescription;
using ValyanClinic.Application.Features.Prescriptions.DTOs;
using ValyanClinic.Application.Features.Prescriptions.Queries.GetConsultationPrescriptions;
using ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionById;
using ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionLookups;
using ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionPdf;
using ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptions;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>Rețete compensate CNAS și rețete simple (necompensate).</summary>
public class PrescriptionsController : BaseApiController
{
    [HttpGet]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<PrescriptionsPagedResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? prescriptionTypeId,
        [FromQuery] Guid? statusId,
        [FromQuery] Guid? doctorId,
        [FromQuery] Guid? patientId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "Date",
        [FromQuery] string sortDir = "desc",
        CancellationToken ct = default)
    {
        var query = new GetPrescriptionsQuery(
            search, prescriptionTypeId, statusId, doctorId, patientId, dateFrom, dateTo,
            page, pageSize, sortBy, sortDir);
        return HandleResult(await Mediator.Send(query, ct));
    }

    [HttpGet("lookups")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<PrescriptionLookupsDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLookups(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetPrescriptionLookupsQuery(), ct));

    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<PrescriptionDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetPrescriptionByIdQuery(id), ct));

    [HttpGet("{id:guid}/pdf")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Read)]
    [ProducesResponseType<FileContentResult>(StatusCodes.Status200OK, "application/pdf")]
    public async Task<IActionResult> GetPdf(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetPrescriptionPdfQuery(id), ct);
        return result.IsSuccess
            ? File(result.Value!.Content, "application/pdf", result.Value.FileName)
            : HandleResult(result);
    }

    [HttpGet("by-consultation/{consultationId:guid}")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<PrescriptionListDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByConsultation(Guid consultationId, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetConsultationPrescriptionsQuery(consultationId), ct));

    [HttpPost]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<Guid>>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreatePrescriptionsCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    [HttpPost("from-consultation/{consultationId:guid}")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<Guid>>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> GenerateFromConsultation(
        Guid consultationId, [FromBody] GenerateConsultationPrescriptionsRequest request, CancellationToken ct)
    {
        var command = new GenerateConsultationPrescriptionsCommand(
            consultationId, request.CareTypeId, request.InsuredCategoryId, request.TreatmentDays);
        return HandleResult(await Mediator.Send(command, ct));
    }

    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePrescriptionRequest request, CancellationToken ct)
    {
        var command = new UpdatePrescriptionCommand(
            id, request.CareTypeId, request.InsuredCategoryId, request.TreatmentDays, request.Diagnostic,
            request.DiagnosticCodes, request.RegistryNumber, request.IsContinuation, request.ReferralLetterNumber,
            request.Notes, request.Items);
        return HandleResult(await Mediator.Send(command, ct));
    }

    [HttpPost("{id:guid}/issue")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Issue(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new IssuePrescriptionCommand(id), ct));

    [HttpPost("{id:guid}/transmit")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Transmit(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new TransmitPrescriptionCommand(id), ct));

    // Medicul (drept Write) anulează propriile rețete emise — anularea nu șterge date
    [HttpPost("{id:guid}/cancel")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelPrescriptionRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(new CancelPrescriptionCommand(id, request.Reason), ct));

    // Se pot șterge doar ciornele (neemise), deci Write e suficient
    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Prescriptions, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new DeletePrescriptionCommand(id), ct));
}
