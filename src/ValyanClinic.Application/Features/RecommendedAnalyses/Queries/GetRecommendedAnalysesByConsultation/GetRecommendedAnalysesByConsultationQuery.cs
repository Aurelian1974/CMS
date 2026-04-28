using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.RecommendedAnalyses.DTOs;

namespace ValyanClinic.Application.Features.RecommendedAnalyses.Queries.GetRecommendedAnalysesByConsultation;

public sealed record GetRecommendedAnalysesByConsultationQuery(Guid ConsultationId)
    : IRequest<Result<IReadOnlyList<RecommendedAnalysisDto>>>;

public sealed class GetRecommendedAnalysesByConsultationQueryHandler(
    IRecommendedAnalysisRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetRecommendedAnalysesByConsultationQuery, Result<IReadOnlyList<RecommendedAnalysisDto>>>
{
    public async Task<Result<IReadOnlyList<RecommendedAnalysisDto>>> Handle(
        GetRecommendedAnalysesByConsultationQuery request, CancellationToken ct)
    {
        var rows = await repository.GetByConsultationAsync(request.ConsultationId, currentUser.ClinicId, ct);
        return Result<IReadOnlyList<RecommendedAnalysisDto>>.Success(rows);
    }
}
