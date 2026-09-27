using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Features.Invoices.Commands.StornoInvoice;

/// <summary>Stornare integrală: factură nouă cu valori negative, legată de originală.</summary>
public sealed record StornoInvoiceCommand(Guid Id, Guid IdempotencyKey, string Reason)
    : IRequest<Result<CreateInvoiceResult>>;
