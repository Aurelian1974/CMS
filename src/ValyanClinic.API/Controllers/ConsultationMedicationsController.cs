using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ConsultationMedications.Commands.CreateConsultationMedication;
using ValyanClinic.Application.Features.ConsultationMedications.Commands.DeleteConsultationMedication;
using ValyanClinic.Application.Features.ConsultationMedications.Commands.UpdateConsultationMedication;
using ValyanClinic.Application.Features.ConsultationMedications.DTOs;
using ValyanClinic.Application.Features.ConsultationMedications.Queries.GetConsultationMedications;
using ValyanClinic.Application.Features.ConsultationMedications.Queries.SearchCnasDrugs;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>Tratamentul recomandat în consultație — medicamente din nomenclatorul CNAS.</summary>
public class ConsultationMedicationsController : BaseApiController
{
    [HttpGet("by-consultation/{consultationId:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<ConsultationMedicationDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByConsultation(Guid consultationId, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetConsultationMedicationsQuery(consultationId), ct));

    // Acces pe modulul Consultații: medicul prescrie fără drept separat pe nomenclatorul CNAS
    [HttpGet("drug-search")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<CnasDrugLookupDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchDrugs(
        [FromQuery] string search,
        [FromQuery] int top = SearchCnasDrugsQuery.DefaultTop,
        CancellationToken ct = default)
        => HandleResult(await Mediator.Send(new SearchCnasDrugsQuery(search, top), ct));

    [HttpPost]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateConsultationMedicationCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateConsultationMedicationRequest request, CancellationToken ct)
    {
        var command = new UpdateConsultationMedicationCommand(
            id, request.CopaymentListType, request.DoseMorning, request.DoseAfternoon, request.DoseEvening,
            request.DurationDays, request.Notes);
        return HandleResult(await Mediator.Send(command, ct));
    }

    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Consultations, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new DeleteConsultationMedicationCommand(id), ct));
}
