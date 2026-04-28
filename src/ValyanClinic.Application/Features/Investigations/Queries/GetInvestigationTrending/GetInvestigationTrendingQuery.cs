using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Investigations.DTOs;

namespace ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationTrending;

public sealed record GetInvestigationTrendingQuery(
    Guid PatientId,
    string InvestigationType,
    string JsonPath,
    DateTime? DateFrom,
    DateTime? DateTo
) : IRequest<Result<IReadOnlyList<InvestigationTrendingPointDto>>>;

public sealed class GetInvestigationTrendingQueryHandler(
    IInvestigationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetInvestigationTrendingQuery, Result<IReadOnlyList<InvestigationTrendingPointDto>>>
{
    public async Task<Result<IReadOnlyList<InvestigationTrendingPointDto>>> Handle(
        GetInvestigationTrendingQuery request, CancellationToken cancellationToken)
    {
        var list = await repository.GetTrendingAsync(
            request.PatientId, currentUser.ClinicId,
            request.InvestigationType, request.JsonPath,
            request.DateFrom, request.DateTo, cancellationToken);
        return Result<IReadOnlyList<InvestigationTrendingPointDto>>.Success(list);
    }
}
