using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicContact;

public sealed class UpdateClinicContactCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateClinicContactCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateClinicContactCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateContactAsync(
                request.Id,
                currentUser.ClinicId,
                request.ContactType,
                request.Value,
                request.Label,
                request.IsMain,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50270)
        {
            return Result<bool>.NotFound(ErrorMessages.ClinicContact.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
