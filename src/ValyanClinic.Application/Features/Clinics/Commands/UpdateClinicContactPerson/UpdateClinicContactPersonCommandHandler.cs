using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicContactPerson;

public sealed class UpdateClinicContactPersonCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateClinicContactPersonCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateClinicContactPersonCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateContactPersonAsync(
                request.Id,
                currentUser.ClinicId,
                request.Name,
                request.Function,
                request.PhoneNumber,
                request.Email,
                request.IsMain,
                cancellationToken);

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
