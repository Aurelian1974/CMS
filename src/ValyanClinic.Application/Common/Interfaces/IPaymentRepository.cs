using ValyanClinic.Application.Features.Payments.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IPaymentRepository
{
    /// <summary>
    /// Idempotent după <paramref name="idempotencyKey"/>. Pentru numerar / card creează în aceeași
    /// tranzacție bonul fiscal PENDING și trece consultația în FACTURATA.
    /// </summary>
    Task<CreatePaymentResult> CreateAsync(
        Guid clinicId, Guid consultationId, Guid idempotencyKey, IReadOnlyList<PaymentTenderInput> tenders,
        string? notes, Guid createdBy, CancellationToken ct);

    Task CancelAsync(Guid id, Guid clinicId, string reason, Guid cancelledBy, CancellationToken ct);
}
