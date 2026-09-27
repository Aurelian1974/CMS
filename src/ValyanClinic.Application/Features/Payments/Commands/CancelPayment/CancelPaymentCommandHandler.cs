using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Payments.Commands.CancelPayment;

public sealed class CancelPaymentCommandHandler(
    IPaymentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CancelPaymentCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(CancelPaymentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.CancelAsync(
                request.Id, currentUser.ClinicId, request.Reason.Trim(), currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.PaymentNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Billing.PaymentNotFound);
        }
        catch (SqlException ex) when (ex.Number is SqlErrorCodes.PaymentCannotCancel or SqlErrorCodes.FiscalReceiptUnresolved)
        {
            return Result<bool>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
