using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.AddMedicalServicePrice;

public sealed class AddMedicalServicePriceCommandHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<AddMedicalServicePriceCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddMedicalServicePriceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.AddPriceAsync(
                currentUser.ClinicId, request.MedicalServiceId, request.Price, request.VatRateId,
                request.ValidFrom, currentUser.Id, cancellationToken);
            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.MedicalServiceNotFound)
        {
            return Result<Guid>.NotFound(ErrorMessages.Tariff.ServiceNotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
