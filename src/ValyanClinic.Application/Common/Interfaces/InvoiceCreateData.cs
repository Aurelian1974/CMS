using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public sealed record InvoiceCreateData(
    Guid ClinicId,
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
    IReadOnlyList<InvoiceLineInput> Lines);
