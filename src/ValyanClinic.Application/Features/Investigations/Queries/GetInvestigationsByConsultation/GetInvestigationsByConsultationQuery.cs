using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Investigations.DTOs;

namespace ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationsByConsultation;

public sealed record GetInvestigationsByConsultationQuery(Guid ConsultationId)
    : IRequest<Result<IReadOnlyList<InvestigationDto>>>;

public sealed class GetInvestigationsByConsultationQueryHandler(
    IInvestigationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetInvestigationsByConsultationQuery, Result<IReadOnlyList<InvestigationDto>>>
{
    public async Task<Result<IReadOnlyList<InvestigationDto>>> Handle(
        GetInvestigationsByConsultationQuery request, CancellationToken cancellationToken)
    {
        var list = await repository.GetByConsultationAsync(request.ConsultationId, currentUser.ClinicId, cancellationToken);
        return Result<IReadOnlyList<InvestigationDto>>.Success(list);
    }
}
