using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Appointments.Commands.DeleteAppointment;

public sealed class DeleteAppointmentCommandHandler(
    IAppointmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteAppointmentCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteAppointmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(
                request.Id,
                currentUser.ClinicId,
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
