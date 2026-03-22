using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentById;

public sealed class GetAppointmentByIdQueryHandler(
    IAppointmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAppointmentByIdQuery, Result<AppointmentDetailDto>>
{
    public async Task<Result<AppointmentDetailDto>> Handle(
        GetAppointmentByIdQuery request, CancellationToken cancellationToken)
    {
        var appointment = await repository.GetByIdAsync(
            request.Id, currentUser.ClinicId, cancellationToken);

        return appointment is null
            ? Result<AppointmentDetailDto>.NotFound(ErrorMessages.Appointment.NotFound)
            : Result<AppointmentDetailDto>.Success(appointment);
    }
}
