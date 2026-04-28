using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Investigations.DTOs;

namespace ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationTypes;

public sealed record GetInvestigationTypesQuery(string? Specialty)
    : IRequest<Result<IReadOnlyList<InvestigationTypeDto>>>;

public sealed class GetInvestigationTypesQueryHandler(IInvestigationRepository repository)
    : IRequestHandler<GetInvestigationTypesQuery, Result<IReadOnlyList<InvestigationTypeDto>>>
{
    public async Task<Result<IReadOnlyList<InvestigationTypeDto>>> Handle(
        GetInvestigationTypesQuery request, CancellationToken cancellationToken)
    {
        var list = await repository.GetTypesAsync(request.Specialty, cancellationToken);
        return Result<IReadOnlyList<InvestigationTypeDto>>.Success(list);
    }
}
