using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.Commands.AddMedicalServicePrice;
using ValyanClinic.Application.Features.Tariffs.Commands.CreateMedicalService;
using ValyanClinic.Application.Features.Tariffs.Commands.CreateVatRate;
using ValyanClinic.Application.Features.Tariffs.Commands.SetMedicalServiceActive;
using ValyanClinic.Application.Features.Tariffs.Commands.UpdateMedicalService;
using ValyanClinic.Application.Features.Tariffs.Commands.UpdateVatRate;
using ValyanClinic.Application.Features.Tariffs.DTOs;
using ValyanClinic.Application.Features.Tariffs.Queries.GetBillingLookups;
using ValyanClinic.Application.Features.Tariffs.Queries.GetMedicalServiceById;
using ValyanClinic.Application.Features.Tariffs.Queries.GetMedicalServices;
using ValyanClinic.Application.Features.Tariffs.Queries.GetVatRates;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>Nomenclatorul de tarife: servicii medicale, prețuri versionate, regimuri TVA.</summary>
public class TariffsController : BaseApiController
{
    [HttpGet]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<MedicalServicesPagedResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "Name",
        [FromQuery] string sortDir = "asc",
        CancellationToken ct = default)
    {
        var query = new GetMedicalServicesQuery(search, categoryId, isActive, page, pageSize, sortBy, sortDir);
        return HandleResult(await Mediator.Send(query, ct));
    }

    [HttpGet("lookups")]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<BillingLookupsDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLookups(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetBillingLookupsQuery(), ct));

    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<MedicalServiceDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetMedicalServiceByIdQuery(id), ct));

    [HttpPost]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateMedicalServiceCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMedicalServiceRequest request, CancellationToken ct)
    {
        var command = new UpdateMedicalServiceCommand(
            id, request.Code, request.Name, request.CategoryId, request.DurationMinutes,
            request.InvestigationTypeCode, request.RowVersion);
        return HandleResult(await Mediator.Send(command, ct));
    }

    [HttpPatch("{id:guid}/active")]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(new SetMedicalServiceActiveCommand(id, request.IsActive), ct));

    [HttpPost("{id:guid}/prices")]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> AddPrice(Guid id, [FromBody] AddMedicalServicePriceRequest request, CancellationToken ct)
    {
        var command = new AddMedicalServicePriceCommand(id, request.Price, request.VatRateId, request.ValidFrom);
        return HandleResult(await Mediator.Send(command, ct));
    }

    [HttpGet("vat-rates")]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<VatRateDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVatRates(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetVatRatesQuery(), ct));

    // Regimurile TVA au efect fiscal pe toate serviciile — doar administrare completă
    [HttpPost("vat-rates")]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Full)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateVatRate([FromBody] CreateVatRateCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    [HttpPut("vat-rates/{id:guid}")]
    [HasAccess(ModuleCodes.Tariffs, AccessLevel.Full)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateVatRate(Guid id, [FromBody] UpdateVatRateRequest request, CancellationToken ct)
    {
        var command = new UpdateVatRateCommand(
            id, request.Name, request.Percent, request.UblCategoryCode,
            request.ExemptionReasonCode, request.ExemptionReasonText, request.IsActive);
        return HandleResult(await Mediator.Send(command, ct));
    }
}
