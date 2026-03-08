using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicAddress;

public sealed class UpdateClinicAddressCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateClinicAddressCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateClinicAddressCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAddressAsync(
                request.Id,
                currentUser.ClinicId,
                request.AddressType,
                request.Street,
                request.City,
                request.County,
                request.PostalCode,
                request.Country,
                request.IsMain,
                cancellationToken);

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
