using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FiscalReceipts.DTOs;

namespace ValyanClinic.Application.Features.FiscalReceipts.Commands.StartFiscalReceiptPrint;

/// <summary>
/// Rezervă bonul pentru tipărire (PENDING / FAILED → PRINTING) și întoarce payload-ul
/// pe care clientul îl trimite la fiscal bridge.
/// </summary>
public sealed record StartFiscalReceiptPrintCommand(Guid Id) : IRequest<Result<FiscalReceiptDetailDto>>;
