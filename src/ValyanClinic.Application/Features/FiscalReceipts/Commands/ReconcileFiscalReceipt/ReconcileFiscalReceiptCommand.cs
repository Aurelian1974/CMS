using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.FiscalReceipts.Commands.ReconcileFiscalReceipt;

/// <summary>
/// Utilizatorul confirmă dacă bonul cu stare necunoscută a ieșit din aparat.
/// Niciodată nu se emite automat un al doilea bon.
/// </summary>
public sealed record ReconcileFiscalReceiptCommand(
    Guid Id,
    bool WasPrinted,
    string? ReceiptNumber,
    string? Note)
    : IRequest<Result<bool>>;
