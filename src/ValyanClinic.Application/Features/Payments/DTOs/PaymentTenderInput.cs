namespace ValyanClinic.Application.Features.Payments.DTOs;

public sealed record PaymentTenderInput(Guid PaymentMethodId, decimal Amount);
