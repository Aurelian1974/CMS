using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;

namespace ValyanClinic.Application.Features.Consultations.Queries.GetConsultationByAppointmentId;

public sealed class GetConsultationByAppointmentIdQueryHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetConsultationByAppointmentIdQuery, Result<ConsultationDetailDto?>>
{
    public async Task<Result<ConsultationDetailDto?>> Handle(
        GetConsultationByAppointmentIdQuery request, CancellationToken cancellationToken)
    {
        var consultation = await repository.GetByAppointmentIdAsync(
            request.AppointmentId, currentUser.ClinicId, cancellationToken);

        return Result<ConsultationDetailDto?>.Success(consultation);
    }
}
