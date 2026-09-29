using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.Commands.CreateBridgePairingTicket;
using ValyanClinic.Application.Features.FinancialSettings.Commands.CreateInvoiceSeries;
using ValyanClinic.Application.Features.FinancialSettings.Commands.UpdateFiscalSettings;
using ValyanClinic.Application.Features.FinancialSettings.Commands.UpdateInvoiceSeries;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;
using ValyanClinic.Application.Features.FinancialSettings.Queries.GetBridgePairingKey;
using ValyanClinic.Application.Features.FinancialSettings.Queries.GetFiscalSettings;
using ValyanClinic.Application.Features.FinancialSettings.Queries.GetInvoiceSeries;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>Setări financiare: casa de marcat (mapări, bridge), statut TVA, serii de facturi.</summary>
public class FinancialSettingsController : BaseApiController
{
    // Recepția citește adresa bridge-ului pentru tipărirea bonului
    [HttpGet("fiscal")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<FiscalSettingsDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFiscal(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetFiscalSettingsQuery(), ct));

    [HttpPut("fiscal")]
    [HasAccess(ModuleCodes.Invoices, AccessLevel.Full)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateFiscal([FromBody] UpdateFiscalSettingsCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    // Asocierea stăției: handler-ul permite doar rolul admin
    [HttpPost("fiscal/bridge-pairing-ticket")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<BridgePairingTicketDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<string>>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateBridgePairingTicket(CancellationToken ct)
        => HandleResult(await Mediator.Send(new CreateBridgePairingTicketCommand(), ct));

    [HttpGet("fiscal/bridge-pairing-key")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<BridgePairingKeyDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<string>>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetBridgePairingKey(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetBridgePairingKeyQuery(), ct));

    [HttpGet("invoice-series")]
    [HasAccess(ModuleCodes.Invoices, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<InvoiceSeriesDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInvoiceSeries(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetInvoiceSeriesQuery(), ct));

    [HttpPost("invoice-series")]
    [HasAccess(ModuleCodes.Invoices, AccessLevel.Full)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateInvoiceSeries([FromBody] CreateInvoiceSeriesCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    [HttpPut("invoice-series/{id:guid}")]
    [HasAccess(ModuleCodes.Invoices, AccessLevel.Full)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateInvoiceSeries(
        Guid id, [FromBody] UpdateInvoiceSeriesRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(new UpdateInvoiceSeriesCommand(id, request.IsDefault, request.IsActive), ct));
}
