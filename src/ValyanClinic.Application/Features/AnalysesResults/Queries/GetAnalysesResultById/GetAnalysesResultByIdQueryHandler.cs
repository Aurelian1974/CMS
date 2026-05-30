using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultById;

public sealed class GetAnalysesResultByIdQueryHandler(
    IAnalysesResultRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAnalysesResultByIdQuery, Result<AnalysesResultDetailDto>>
{
    public async Task<Result<AnalysesResultDetailDto>> Handle(
        GetAnalysesResultByIdQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);

        return result is null
            ? Result<AnalysesResultDetailDto>.NotFound(ErrorMessages.AnalysesResult.NotFound)
            : Result<AnalysesResultDetailDto>.Success(result);
    }
}
