using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Queries.GetAnalysesResultsByPatient;

public sealed class GetAnalysesResultsByPatientQueryHandler(
    IAnalysesResultRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAnalysesResultsByPatientQuery, Result<AnalysesResultsByPatientResponse>>
{
    public async Task<Result<AnalysesResultsByPatientResponse>> Handle(
        GetAnalysesResultsByPatientQuery request, CancellationToken cancellationToken)
    {
        var (headers, details) = await repository.GetByPatientAsync(
            request.PatientId,
            currentUser.ClinicId,
            request.DateFrom,
            request.DateTo,
            cancellationToken);

        var response = new AnalysesResultsByPatientResponse(headers, details);
        return Result<AnalysesResultsByPatientResponse>.Success(response);
    }
}
