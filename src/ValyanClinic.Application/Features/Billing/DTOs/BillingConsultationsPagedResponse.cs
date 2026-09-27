using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Billing.DTOs;

public sealed class BillingConsultationsPagedResponse
{
    public required PagedResult<BillingConsultationListDto> PagedResult { get; init; }
    public required BillingStatsDto Stats { get; init; }
}
