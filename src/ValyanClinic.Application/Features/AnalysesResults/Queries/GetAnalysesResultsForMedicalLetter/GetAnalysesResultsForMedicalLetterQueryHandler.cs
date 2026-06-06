using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultsForMedicalLetter;

public sealed class GetAnalysesResultsForMedicalLetterQueryHandler(
    IAnalysesResultRepository repository)
    : IRequestHandler<GetAnalysesResultsForMedicalLetterQuery, Result<AnalysesResultsForLetterResponse>>
{
    public async Task<Result<AnalysesResultsForLetterResponse>> Handle(
        GetAnalysesResultsForMedicalLetterQuery request, CancellationToken cancellationToken)
    {
        var response = await repository.GetForMedicalLetterAsync(
            request.ConsultationId, cancellationToken);

        return Result<AnalysesResultsForLetterResponse>.Success(response);
    }
}
