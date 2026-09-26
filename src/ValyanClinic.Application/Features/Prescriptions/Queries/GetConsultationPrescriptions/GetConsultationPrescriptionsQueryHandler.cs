using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetConsultationPrescriptions;

public sealed class GetConsultationPrescriptionsQueryHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetConsultationPrescriptionsQuery, Result<IReadOnlyList<PrescriptionListDto>>>
{
    public async Task<Result<IReadOnlyList<PrescriptionListDto>>> Handle(
        GetConsultationPrescriptionsQuery request, CancellationToken cancellationToken)
    {
        var rows = await repository.GetByConsultationAsync(
            request.ConsultationId, currentUser.ClinicId, cancellationToken);
        return Result<IReadOnlyList<PrescriptionListDto>>.Success(rows);
    }
}
