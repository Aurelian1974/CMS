using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetVatRates;

public sealed class GetVatRatesQueryHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetVatRatesQuery, Result<IReadOnlyList<VatRateDto>>>
{
    public async Task<Result<IReadOnlyList<VatRateDto>>> Handle(
        GetVatRatesQuery request, CancellationToken cancellationToken)
        => Result<IReadOnlyList<VatRateDto>>.Success(
            await repository.GetVatRatesAsync(currentUser.ClinicId, cancellationToken));
}
