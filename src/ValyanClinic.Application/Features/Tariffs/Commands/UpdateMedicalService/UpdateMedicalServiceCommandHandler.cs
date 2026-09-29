using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.UpdateMedicalService;

public sealed class UpdateMedicalServiceCommandHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateMedicalServiceCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateMedicalServiceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                new MedicalServiceUpdateData(
                    request.Id,
                    currentUser.ClinicId,
                    request.Code.Trim(),
                    request.Name.Trim(),
                    request.CategoryId,
                    request.DurationMinutes,
                    request.InvestigationTypeId,
                    request.RowVersion),
                currentUser.Id,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.MedicalServiceNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Tariff.ServiceNotFound);
        }
        catch (SqlException ex) when (ex.Number is SqlErrorCodes.MedicalServiceCodeDuplicate
                                                 or SqlErrorCodes.MedicalServiceConcurrency)
        {
            return Result<bool>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
