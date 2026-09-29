using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Billing.DTOs;
using ValyanClinic.Application.Features.Billing.Queries.GetBillingConsultations;
using ValyanClinic.Application.Features.Billing.Queries.GetConsultationBilling;
using ValyanClinic.Application.Features.ConsultationServices.Commands.AddConsultationService;
using ValyanClinic.Application.Features.ConsultationServices.Commands.DeleteConsultationService;
using ValyanClinic.Application.Features.ConsultationServices.Commands.SyncInvestigationServices;
using ValyanClinic.Application.Features.ConsultationServices.Commands.UpdateConsultationServiceQuantity;
using ValyanClinic.Application.Features.FiscalReceipts.Commands.ReconcileFiscalReceipt;
using ValyanClinic.Application.Features.FiscalReceipts.Commands.ReportFiscalReceiptResult;
using ValyanClinic.Application.Features.FiscalReceipts.Commands.StartFiscalReceiptPrint;
using ValyanClinic.Application.Features.FiscalReceipts.DTOs;
using ValyanClinic.Application.Features.FiscalReceipts.Queries.GetFiscalReceipt;
using ValyanClinic.Application.Features.Payments.Commands.CancelPayment;
using ValyanClinic.Application.Features.Payments.Commands.CreatePayment;
using ValyanClinic.Application.Features.Payments.DTOs;
using ValyanClinic.Infrastructure.Authentication;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Încasări (recepție): situația financiară a consultațiilor, servicii, plăți, bonuri fiscale.
/// Nu expune date clinice — accesul e pe modulul payments, nu consultations.
/// </summary>
public class BillingController : BaseApiController
{
    [HttpGet("consultations")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<BillingConsultationsPagedResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConsultations(
        [FromQuery] string? search,
        [FromQuery] string? paymentStatus,
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new GetBillingConsultationsQuery(search, paymentStatus, dateFrom, dateTo, page, pageSize);
        return HandleResult(await Mediator.Send(query, ct));
    }

    [HttpGet("consultations/{consultationId:guid}")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<ConsultationBillingDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConsultation(Guid consultationId, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetConsultationBillingQuery(consultationId), ct));

    [HttpPost("consultations/{consultationId:guid}/services")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> AddService(
        Guid consultationId, [FromBody] AddBillingServiceRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(
            new AddConsultationServiceCommand(consultationId, request.MedicalServiceId, request.Quantity), ct));

    [HttpPost("consultations/{consultationId:guid}/services/sync-investigations")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<int>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncInvestigationServices(Guid consultationId, CancellationToken ct)
        => HandleResult(await Mediator.Send(new SyncInvestigationServicesCommand(consultationId), ct));

    [HttpPut("services/{id:guid}")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateServiceQuantity(
        Guid id, [FromBody] UpdateConsultationServiceQuantityRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(new UpdateConsultationServiceQuantityCommand(id, request.Quantity), ct));

    [HttpDelete("services/{id:guid}")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteService(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new DeleteConsultationServiceCommand(id), ct));

    [HttpPost("consultations/{consultationId:guid}/payments")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<CreatePaymentResult>>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiResponse<CreatePaymentResult>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> CreatePayment(
        Guid consultationId, [FromBody] CreatePaymentRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(
            new CreatePaymentCommand(consultationId, request.IdempotencyKey, request.Tenders, request.Notes), ct));

    [HttpPost("payments/{id:guid}/cancel")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelPayment(Guid id, [FromBody] CancelPaymentRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(new CancelPaymentCommand(id, request.Reason), ct));

    [HttpGet("fiscal-receipts/{id:guid}")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<FiscalReceiptDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFiscalReceipt(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetFiscalReceiptQuery(id), ct));

    [HttpPost("fiscal-receipts/{id:guid}/start")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<FiscalReceiptDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> StartFiscalReceipt(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new StartFiscalReceiptPrintCommand(id), ct));

    [HttpPost("fiscal-receipts/{id:guid}/result")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ReportFiscalReceiptResult(
        Guid id, [FromBody] ReportFiscalReceiptResultRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(new ReportFiscalReceiptResultCommand(
            id, request.StatusCode, request.ReceiptNumber, request.DeviceSerialNumber, request.PrintedAt,
            request.ErrorMessage, request.DeviceResponse), ct));

    [HttpPost("fiscal-receipts/{id:guid}/reconcile")]
    [HasAccess(ModuleCodes.Payments, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ReconcileFiscalReceipt(
        Guid id, [FromBody] ReconcileFiscalReceiptRequest request, CancellationToken ct)
        => HandleResult(await Mediator.Send(
            new ReconcileFiscalReceiptCommand(id, request.WasPrinted, request.ReceiptNumber, request.Note), ct));
}
