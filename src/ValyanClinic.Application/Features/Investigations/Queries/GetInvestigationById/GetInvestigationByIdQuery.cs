using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Investigations.DTOs;

namespace ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationById;

public sealed record GetInvestigationByIdQuery(Guid Id) : IRequest<Result<InvestigationDto>>;

public sealed class GetInvestigationByIdQueryHandler(
    IInvestigationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetInvestigationByIdQuery, Result<InvestigationDto>>
{
    public async Task<Result<InvestigationDto>> Handle(GetInvestigationByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);
        return dto is null
            ? Result<InvestigationDto>.NotFound(ErrorMessages.Investigation.NotFound)
            : Result<InvestigationDto>.Success(dto);
    }
}
