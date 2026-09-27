using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.FiscalReceipts.Commands.ReconcileFiscalReceipt;

public sealed class ReconcileFiscalReceiptCommandHandler(
    IFiscalReceiptRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<ReconcileFiscalReceiptCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ReconcileFiscalReceiptCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.ReconcileAsync(
                request.Id,
                currentUser.ClinicId,
                request.WasPrinted,
                request.ReceiptNumber?.Trim(),
                string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
                currentUser.Id,
                cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.FiscalReceiptNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Billing.FiscalReceiptNotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.FiscalReceiptInvalidTransition)
        {
            return Result<bool>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
