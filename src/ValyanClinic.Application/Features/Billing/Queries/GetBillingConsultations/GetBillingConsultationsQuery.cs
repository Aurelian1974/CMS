using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Billing.DTOs;

namespace ValyanClinic.Application.Features.Billing.Queries.GetBillingConsultations;

public sealed record GetBillingConsultationsQuery(
    string? Search,
    string? PaymentStatus,
    DateOnly? DateFrom,
    DateOnly? DateTo,
    int Page = 1,
    int PageSize = 20)
    : IRequest<Result<BillingConsultationsPagedResponse>>;
