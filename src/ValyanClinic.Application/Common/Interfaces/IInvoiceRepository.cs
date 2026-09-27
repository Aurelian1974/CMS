using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IInvoiceRepository
{
    /// <summary>Idempotent după cheie; numărul se alocă fără goluri în aceeași tranzacție.</summary>
    Task<CreateInvoiceResult> CreateAsync(InvoiceCreateData data, Guid createdBy, CancellationToken ct);

    /// <summary>Emite factura storno (valori negative) și marchează originala STORNATA.</summary>
    Task<CreateInvoiceResult> StornoAsync(
        Guid id, Guid clinicId, Guid idempotencyKey, string reason, Guid createdBy, CancellationToken ct);

    Task<InvoiceDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<InvoicePagedResult> GetPagedAsync(Guid clinicId, InvoiceFilterData filter, CancellationToken ct);
}
