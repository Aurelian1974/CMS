using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Appointments.DTOs;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetPatientAppointments;

public sealed class GetPatientAppointmentsQueryHandler(
    IAppointmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetPatientAppointmentsQuery, Result<IEnumerable<AppointmentSchedulerDto>>>
{
    public async Task<Result<IEnumerable<AppointmentSchedulerDto>>> Handle(
        GetPatientAppointmentsQuery request, CancellationToken cancellationToken)
    {
        var appointments = await repository.GetByPatientAsync(
            currentUser.ClinicId, request.PatientId, cancellationToken);

        return Result<IEnumerable<AppointmentSchedulerDto>>.Success(appointments);
    }
}
