using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ConsultationServices.DTOs;
using ValyanClinic.Domain.Services;

namespace ValyanClinic.Application.Features.ConsultationServices.Queries.GetConsultationServices;

public sealed class GetConsultationServicesQueryHandler(
    IConsultationServiceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetConsultationServicesQuery, Result<ConsultationServicesResponse>>
{
    public async Task<Result<ConsultationServicesResponse>> Handle(
        GetConsultationServicesQuery request, CancellationToken cancellationToken)
    {
        var lines = await repository.GetByConsultationAsync(
            request.ConsultationId, currentUser.ClinicId, cancellationToken);
        var unbilled = await repository.GetUnbilledInvestigationsAsync(
            request.ConsultationId, currentUser.ClinicId, cancellationToken);

        return Result<ConsultationServicesResponse>.Success(new ConsultationServicesResponse
        {
            Lines = lines,
            Total = BillingCalculator.Total(lines.Select(l => l.LineTotal)),
            UnbilledInvestigations = unbilled,
        });
    }
}
