using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicLocation;

public sealed class UpdateClinicLocationCommandHandler(
    IClinicLocationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateClinicLocationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateClinicLocationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                request.Id,
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

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50210)
        {
            // Locația nu a fost găsită
            return Result<bool>.NotFound(ErrorMessages.ClinicLocation.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
