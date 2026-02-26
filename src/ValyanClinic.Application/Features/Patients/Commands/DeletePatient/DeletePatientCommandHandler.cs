using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Patients.Commands.DeletePatient;

public sealed class DeletePatientCommandHandler(
    IPatientRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeletePatientCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeletePatientCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(
                request.Id,
                currentUser.ClinicId,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.PatientNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Patient.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
