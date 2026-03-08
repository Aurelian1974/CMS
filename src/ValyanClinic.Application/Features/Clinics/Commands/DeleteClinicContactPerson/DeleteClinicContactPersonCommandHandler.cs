using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicContactPerson;

public sealed class DeleteClinicContactPersonCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteClinicContactPersonCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteClinicContactPersonCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteContactPersonAsync(request.Id, currentUser.ClinicId, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50280)
        {
            return Result<bool>.NotFound(ErrorMessages.ClinicContactPerson.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
