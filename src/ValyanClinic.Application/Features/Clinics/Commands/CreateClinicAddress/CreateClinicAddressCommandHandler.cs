using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicAddress;

public sealed class CreateClinicAddressCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateClinicAddressCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateClinicAddressCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAddressAsync(
                currentUser.ClinicId,
                request.AddressType,
                request.Street,
                request.City,
                request.County,
                request.PostalCode,
                request.Country,
                request.IsMain,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50201)
        {
            return Result<Guid>.NotFound(ErrorMessages.Clinic.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
