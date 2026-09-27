using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.FiscalReceipts.Commands.ReportFiscalReceiptResult;

/// <summary>Rezultatul tipăririi, raportat de client după răspunsul fiscal bridge-ului.</summary>
public sealed record ReportFiscalReceiptResultCommand(
    Guid Id,
    string StatusCode,
    string? ReceiptNumber,
    string? DeviceSerialNumber,
    DateTime? PrintedAt,
    string? ErrorMessage,
    string? DeviceResponse)
    : IRequest<Result<bool>>;
