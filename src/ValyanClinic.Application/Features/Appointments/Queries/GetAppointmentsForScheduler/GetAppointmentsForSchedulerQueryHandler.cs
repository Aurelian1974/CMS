using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentsForScheduler;

public sealed class GetAppointmentsForSchedulerQueryHandler(
    IAppointmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetAppointmentsForSchedulerQuery, Result<IEnumerable<AppointmentSchedulerDto>>>
{
    public async Task<Result<IEnumerable<AppointmentSchedulerDto>>> Handle(
        GetAppointmentsForSchedulerQuery request, CancellationToken cancellationToken)
    {
        var appointments = await repository.GetForSchedulerAsync(
            currentUser.ClinicId,
            request.DateFrom,
            request.DateTo,
            request.DoctorId,
            cancellationToken);

        return Result<IEnumerable<AppointmentSchedulerDto>>.Success(appointments);
    }
}
