using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicAddress;

public sealed class DeleteClinicAddressCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteClinicAddressCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteClinicAddressCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAddressAsync(request.Id, currentUser.ClinicId, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50260)
        {
            return Result<bool>.NotFound(ErrorMessages.ClinicAddress.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
