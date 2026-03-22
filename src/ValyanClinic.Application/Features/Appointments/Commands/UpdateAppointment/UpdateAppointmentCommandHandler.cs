using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointment;

public sealed class UpdateAppointmentCommandHandler(
    IAppointmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateAppointmentCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateAppointmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                request.Id,
                currentUser.ClinicId,
                request.PatientId,
                request.DoctorId,
                request.StartTime,
                request.EndTime,
                request.StatusId,
                request.Notes,
                currentUser.Id,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AppointmentNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Appointment.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AppointmentConflict)
        {
            return Result<bool>.Conflict(ErrorMessages.Appointment.Conflict);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
