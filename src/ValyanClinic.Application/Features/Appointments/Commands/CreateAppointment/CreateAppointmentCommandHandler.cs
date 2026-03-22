using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Appointments.Commands.CreateAppointment;

public sealed class CreateAppointmentCommandHandler(
    IAppointmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateAppointmentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateAppointmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                currentUser.ClinicId,
                request.PatientId,
                request.DoctorId,
                request.StartTime,
                request.EndTime,
                request.StatusId,
                request.Notes,
                currentUser.Id,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AppointmentConflict)
        {
            return Result<Guid>.Conflict(ErrorMessages.Appointment.Conflict);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
