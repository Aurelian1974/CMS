using ValyanClinic.Application.Features.Payments.DTOs;

namespace ValyanClinic.API.Controllers;

public sealed record CreatePaymentRequest(
    Guid IdempotencyKey,
    IReadOnlyList<PaymentTenderInput> Tenders,
    string? Notes);
