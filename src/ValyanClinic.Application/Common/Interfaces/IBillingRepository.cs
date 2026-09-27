using ValyanClinic.Application.Features.Billing.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Situația financiară a consultațiilor (vedere de recepție, fără date clinice).</summary>
public interface IBillingRepository
{
    Task<BillingPagedResult> GetPagedAsync(Guid clinicId, BillingFilterData filter, CancellationToken ct);

    Task<ConsultationBillingDto?> GetSummaryAsync(Guid consultationId, Guid clinicId, CancellationToken ct);
}
