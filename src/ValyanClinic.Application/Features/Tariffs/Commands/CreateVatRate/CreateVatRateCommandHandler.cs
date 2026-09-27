using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.CreateVatRate;

public sealed class CreateVatRateCommandHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateVatRateCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateVatRateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateVatRateAsync(
                currentUser.ClinicId,
                request.Code.Trim().ToUpperInvariant(),
                new VatRateData(
                    request.Name.Trim(),
                    request.Percent,
                    request.UblCategoryCode.Trim().ToUpperInvariant(),
                    string.IsNullOrWhiteSpace(request.ExemptionReasonCode) ? null : request.ExemptionReasonCode.Trim(),
                    string.IsNullOrWhiteSpace(request.ExemptionReasonText) ? null : request.ExemptionReasonText.Trim()),
                currentUser.Id,
                cancellationToken);
            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.VatRateCodeDuplicate)
        {
            return Result<Guid>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
