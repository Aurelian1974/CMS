using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.FiscalReceipts.Commands.ReportFiscalReceiptResult;

public sealed class ReportFiscalReceiptResultCommandHandler(
    IFiscalReceiptRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<ReportFiscalReceiptResultCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ReportFiscalReceiptResultCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.SetResultAsync(
                new FiscalReceiptResultData(
                    request.Id,
                    currentUser.ClinicId,
                    request.StatusCode,
                    request.ReceiptNumber?.Trim(),
                    request.DeviceSerialNumber?.Trim(),
                    request.PrintedAt,
                    request.ErrorMessage,
                    request.DeviceResponse),
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
