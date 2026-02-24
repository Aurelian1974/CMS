using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicLocation;

public sealed class CreateClinicLocationCommandHandler(
    IClinicLocationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateClinicLocationCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateClinicLocationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                currentUser.ClinicId,
                request.Name,
                request.Address,
                request.City,
                request.County,
                request.PostalCode,
                request.PhoneNumber,
                request.Email,
                request.IsPrimary,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50201)
        {
            // Clinica nu există
            return Result<Guid>.NotFound(ErrorMessages.Clinic.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
