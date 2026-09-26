using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.ConsultationMedications.DTOs;

namespace ValyanClinic.Application.Features.ConsultationMedications.Queries.GetConsultationMedications;

public sealed class GetConsultationMedicationsQueryHandler(
    IConsultationMedicationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetConsultationMedicationsQuery, Result<IReadOnlyList<ConsultationMedicationDto>>>
{
    public async Task<Result<IReadOnlyList<ConsultationMedicationDto>>> Handle(
        GetConsultationMedicationsQuery request, CancellationToken ct)
    {
        var rows = await repository.GetByConsultationAsync(request.ConsultationId, currentUser.ClinicId, ct);
        return Result<IReadOnlyList<ConsultationMedicationDto>>.Success(rows);
    }
}
