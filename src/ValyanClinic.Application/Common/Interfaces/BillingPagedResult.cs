using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Billing.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public sealed record BillingPagedResult(
    PagedResult<BillingConsultationListDto> Paged,
    BillingStatsDto Stats);
