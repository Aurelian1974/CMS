using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultsByConsultation;

public sealed class GetAnalysesResultsByConsultationQueryHandler(
    IAnalysesResultRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAnalysesResultsByConsultationQuery, Result<IReadOnlyList<AnalysesResultListDto>>>
{
    public async Task<Result<IReadOnlyList<AnalysesResultListDto>>> Handle(
        GetAnalysesResultsByConsultationQuery request, CancellationToken cancellationToken)
    {
        var results = await repository.GetByConsultationAsync(
            request.ConsultationId, currentUser.ClinicId, cancellationToken);

        return Result<IReadOnlyList<AnalysesResultListDto>>.Success(results);
    }
}
