using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.UpdateInvoiceSeries;

public sealed class UpdateInvoiceSeriesCommandHandler(
    IFinancialSettingsRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateInvoiceSeriesCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateInvoiceSeriesCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateInvoiceSeriesAsync(
                request.Id, currentUser.ClinicId, request.IsDefault, request.IsActive, currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.InvoiceSeriesNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Billing.InvoiceSeriesNotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
