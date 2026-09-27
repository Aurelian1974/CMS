using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Billing.DTOs;

namespace ValyanClinic.Application.Features.Billing.Queries.GetBillingConsultations;

public sealed class GetBillingConsultationsQueryHandler(
    IBillingRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetBillingConsultationsQuery, Result<BillingConsultationsPagedResponse>>
{
    public async Task<Result<BillingConsultationsPagedResponse>> Handle(
        GetBillingConsultationsQuery request, CancellationToken cancellationToken)
    {
        var filter = new BillingFilterData(
            request.Search, request.PaymentStatus, request.DateFrom, request.DateTo, request.Page, request.PageSize);

        var result = await repository.GetPagedAsync(currentUser.ClinicId, filter, cancellationToken);

        return Result<BillingConsultationsPagedResponse>.Success(new BillingConsultationsPagedResponse
        {
            PagedResult = result.Paged,
            Stats = result.Stats,
        });
    }
}
