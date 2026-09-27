using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FiscalReceipts.DTOs;

namespace ValyanClinic.Application.Features.FiscalReceipts.Commands.StartFiscalReceiptPrint;

public sealed class StartFiscalReceiptPrintCommandHandler(
    IFiscalReceiptRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<StartFiscalReceiptPrintCommand, Result<FiscalReceiptDetailDto>>
{
    public async Task<Result<FiscalReceiptDetailDto>> Handle(
        StartFiscalReceiptPrintCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.MarkPrintingAsync(request.Id, currentUser.ClinicId, currentUser.Id, cancellationToken);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.FiscalReceiptNotFound)
        {
            return Result<FiscalReceiptDetailDto>.NotFound(ErrorMessages.Billing.FiscalReceiptNotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.FiscalReceiptInvalidTransition)
        {
            return Result<FiscalReceiptDetailDto>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<FiscalReceiptDetailDto>.Failure(ex.Message);
        }

        var receipt = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);
        return receipt is null
            ? Result<FiscalReceiptDetailDto>.NotFound(ErrorMessages.Billing.FiscalReceiptNotFound)
            : Result<FiscalReceiptDetailDto>.Success(receipt);
    }
}
