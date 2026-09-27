using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.SetMedicalServiceActive;

public sealed class SetMedicalServiceActiveCommandHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<SetMedicalServiceActiveCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(SetMedicalServiceActiveCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.SetActiveAsync(
                request.Id, currentUser.ClinicId, request.IsActive, currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.MedicalServiceNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Tariff.ServiceNotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
