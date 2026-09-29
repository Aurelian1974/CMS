using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ConsultationServices.Commands.AddConsultationService;
using ValyanClinic.Application.Features.ConsultationServices.Commands.DeleteConsultationService;
using ValyanClinic.Application.Features.ConsultationServices.Commands.SyncInvestigationServices;
using ValyanClinic.Application.Features.ConsultationServices.Commands.UpdateConsultationServiceQuantity;
using ValyanClinic.Application.Features.ConsultationServices.DTOs;
using ValyanClinic.Application.Features.ConsultationServices.Queries.GetConsultationServices;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Serviciile facturabile adăugate de medic în consultație.
/// Recepția gestionează aceleași linii prin BillingController (modulul payments), fără acces clinic.
/// </summary>
public class ConsultationServicesController : BaseApiController
{
    [HttpGet("by-consultation/{consultationId:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<ConsultationServicesResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByConsultation(Guid consultationId, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetConsultationServicesQuery(consultationId), ct));

    [HttpPost]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Add([FromBody] AddConsultationServiceCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    [HttpPost("by-consultation/{consultationId:guid}/sync-investigations")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<int>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncInvestigations(Guid consultationId, CancellationToken ct)
        => HandleResult(await Mediator.Send(new SyncInvestigationServicesCommand(consultationId), ct));

    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateQuantity(
        Guid id, [FromBody] UpdateConsultationServiceQuantityRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(new UpdateConsultationServiceQuantityCommand(id, request.Quantity), ct));

    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new DeleteConsultationServiceCommand(id), ct));
}
