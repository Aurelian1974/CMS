using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Doctors.Commands.DeleteDoctor;

public sealed class DeleteDoctorCommandHandler(
    IDoctorRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteDoctorCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteDoctorCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(
                request.Id,
                currentUser.ClinicId,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50300)
        {
            return Result<bool>.NotFound(ErrorMessages.Doctor.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
