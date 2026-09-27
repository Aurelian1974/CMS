using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.Commands.CreateInvoice;
using ValyanClinic.Application.Features.Invoices.Commands.StornoInvoice;
using ValyanClinic.Application.Features.Invoices.DTOs;
using ValyanClinic.Application.Features.Invoices.Queries.GetInvoiceById;
using ValyanClinic.Application.Features.Invoices.Queries.GetInvoicePdf;
using ValyanClinic.Application.Features.Invoices.Queries.GetInvoices;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>Facturi: emitere din consultație finalizată, PDF, stornare. Nu există update / delete.</summary>
public class InvoicesController : BaseApiController
{
    [HttpGet]
    [HasAccess(ModuleCodes.Invoices, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<InvoicesPagedResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? statusId,
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "IssueDate",
        [FromQuery] string sortDir = "desc",
        CancellationToken ct = default)
    {
        var query = new GetInvoicesQuery(search, statusId, dateFrom, dateTo, page, pageSize, sortBy, sortDir);
        return HandleResult(await Mediator.Send(query, ct));
    }

    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Invoices, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<InvoiceDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetInvoiceByIdQuery(id), ct));

    [HttpGet("{id:guid}/pdf")]
    [HasAccess(ModuleCodes.Invoices, AccessLevel.Read)]
    [ProducesResponseType<FileContentResult>(StatusCodes.Status200OK, "application/pdf")]
    public async Task<IActionResult> GetPdf(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetInvoicePdfQuery(id), ct);
        return result.IsSuccess
            ? File(result.Value!.Content, "application/pdf", result.Value.FileName)
            : HandleResult(result);
    }

    [HttpPost]
    [HasAccess(ModuleCodes.Invoices, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<CreateInvoiceResult>>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiResponse<CreateInvoiceResult>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    // Stornarea anulează fiscal un document emis — doar nivel Full (manager / admin)
    [HttpPost("{id:guid}/storno")]
    [HasAccess(ModuleCodes.Invoices, AccessLevel.Full)]
    [ProducesResponseType<ApiResponse<CreateInvoiceResult>>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiResponse<CreateInvoiceResult>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Storno(Guid id, [FromBody] StornoInvoiceRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(new StornoInvoiceCommand(id, request.IdempotencyKey, request.Reason), ct));
}
