using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.UpdateFiscalSettings;

public sealed class UpdateFiscalSettingsCommandHandler(
    IFinancialSettingsRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateFiscalSettingsCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateFiscalSettingsCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateFiscalSettingsAsync(
                new FiscalSettingsUpdateData(
                    currentUser.ClinicId,
                    request.IsEnabled,
                    request.BridgeUrl.Trim().TrimEnd('/'),
                    request.IsVatPayer,
                    request.VatMappings,
                    request.PaymentMappings),
                currentUser.Id,
                cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
