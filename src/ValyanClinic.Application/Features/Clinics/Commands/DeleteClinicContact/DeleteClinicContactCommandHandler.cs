using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicContact;

public sealed class DeleteClinicContactCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteClinicContactCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteClinicContactCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteContactAsync(request.Id, currentUser.ClinicId, cancellationToken);
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
