using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Features.Invoices.Commands.CreateInvoice;

/// <summary>
/// Emite factura unei consultații finalizate. Liniile vin din serviciile consultației;
/// <see cref="Lines"/> se completează doar pentru factura de corecție (după storno).
/// CNP-ul se trece pe factură doar la cerere (<see cref="IncludeCnp"/>) și se citește pe server.
/// </summary>
public sealed record CreateInvoiceCommand(
    Guid ConsultationId,
    Guid IdempotencyKey,
    Guid? SeriesId,
    bool CustomerIsLegalEntity,
    string CustomerName,
    bool IncludeCnp,
    string? CustomerFiscalCode,
    string? CustomerTradeRegisterNumber,
    string? CustomerAddress,
    string? CustomerCity,
    string? CustomerCounty,
    IReadOnlyList<InvoiceLineInput>? Lines)
    : IRequest<Result<CreateInvoiceResult>>;
