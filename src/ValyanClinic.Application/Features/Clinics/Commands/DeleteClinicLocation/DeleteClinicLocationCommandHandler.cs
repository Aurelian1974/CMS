using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicLocation;

public sealed class DeleteClinicLocationCommandHandler(
    IClinicLocationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteClinicLocationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteClinicLocationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(
                request.Id,
                currentUser.ClinicId,
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
