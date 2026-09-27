using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.CreateInvoiceSeries;

public sealed class CreateInvoiceSeriesCommandHandler(
    IFinancialSettingsRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateInvoiceSeriesCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateInvoiceSeriesCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateInvoiceSeriesAsync(
                currentUser.ClinicId, request.Series.Trim().ToUpperInvariant(), request.StartNumber,
                request.IsDefault, currentUser.Id, cancellationToken);
            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.InvoiceSeriesDuplicate)
        {
            return Result<Guid>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
