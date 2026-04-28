using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Investigations.DTOs;

namespace ValyanClinic.Application.Features.Investigations.Queries.GetInvestigationsByPatient;

public sealed record GetInvestigationsByPatientQuery(
    Guid PatientId,
    string? InvestigationType,
    DateTime? DateFrom,
    DateTime? DateTo
) : IRequest<Result<IReadOnlyList<InvestigationDto>>>;

public sealed class GetInvestigationsByPatientQueryHandler(
    IInvestigationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetInvestigationsByPatientQuery, Result<IReadOnlyList<InvestigationDto>>>
{
    public async Task<Result<IReadOnlyList<InvestigationDto>>> Handle(
        GetInvestigationsByPatientQuery request, CancellationToken cancellationToken)
    {
        var list = await repository.GetByPatientAsync(
            request.PatientId, currentUser.ClinicId,
            request.InvestigationType, request.DateFrom, request.DateTo, cancellationToken);
        return Result<IReadOnlyList<InvestigationDto>>.Success(list);
    }
}
