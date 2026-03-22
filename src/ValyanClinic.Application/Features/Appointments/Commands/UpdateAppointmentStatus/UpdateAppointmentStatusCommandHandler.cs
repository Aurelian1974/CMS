using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointmentStatus;

public sealed class UpdateAppointmentStatusCommandHandler(
    IAppointmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateAppointmentStatusCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateAppointmentStatusCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateStatusAsync(
                request.Id,
                currentUser.ClinicId,
                request.StatusId,
                currentUser.Id,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AppointmentNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Appointment.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
