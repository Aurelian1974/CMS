using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.Commands.UpdateVatRate;

public sealed class UpdateVatRateCommandHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateVatRateCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateVatRateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateVatRateAsync(
                request.Id,
                currentUser.ClinicId,
                new VatRateData(
                    request.Name.Trim(),
                    request.Percent,
                    request.UblCategoryCode.Trim().ToUpperInvariant(),
                    string.IsNullOrWhiteSpace(request.ExemptionReasonCode) ? null : request.ExemptionReasonCode.Trim(),
                    string.IsNullOrWhiteSpace(request.ExemptionReasonText) ? null : request.ExemptionReasonText.Trim()),
                request.IsActive,
                currentUser.Id,
                cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.VatRateNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Tariff.VatRateNotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
