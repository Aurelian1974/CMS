using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetBillingLookups;

public sealed class GetBillingLookupsQueryHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetBillingLookupsQuery, Result<BillingLookupsDto>>
{
    public async Task<Result<BillingLookupsDto>> Handle(
        GetBillingLookupsQuery request, CancellationToken cancellationToken)
        => Result<BillingLookupsDto>.Success(
            await repository.GetLookupsAsync(currentUser.ClinicId, cancellationToken));
}
