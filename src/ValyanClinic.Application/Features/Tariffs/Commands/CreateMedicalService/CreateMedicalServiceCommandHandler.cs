using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.CreateMedicalService;

public sealed class CreateMedicalServiceCommandHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateMedicalServiceCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateMedicalServiceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                new MedicalServiceCreateData(
                    currentUser.ClinicId,
                    request.Code.Trim(),
                    request.Name.Trim(),
                    request.CategoryId,
                    request.DurationMinutes,
                    request.InvestigationTypeId,
                    request.Price,
                    request.VatRateId,
                    request.ValidFrom),
                currentUser.Id,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.MedicalServiceCodeDuplicate)
        {
            return Result<Guid>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
