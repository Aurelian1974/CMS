using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Payments.DTOs;

namespace ValyanClinic.Application.Features.Payments.Commands.CreatePayment;

/// <summary>
/// Încasare pe consultație. <see cref="IdempotencyKey"/> e generată de client la deschiderea
/// dialogului: dublu-click-ul sau retry-ul trimit aceeași cheie și primesc aceeași plată.
/// </summary>
public sealed record CreatePaymentCommand(
    Guid ConsultationId,
    Guid IdempotencyKey,
    IReadOnlyList<PaymentTenderInput> Tenders,
    string? Notes)
    : IRequest<Result<CreatePaymentResult>>;
