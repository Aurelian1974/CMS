using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Features.Invoices.Commands.StornoInvoice;

public sealed class StornoInvoiceCommandHandler(
    IInvoiceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<StornoInvoiceCommand, Result<CreateInvoiceResult>>
{
    public async Task<Result<CreateInvoiceResult>> Handle(StornoInvoiceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await repository.StornoAsync(
                request.Id, currentUser.ClinicId, request.IdempotencyKey, request.Reason.Trim(),
                currentUser.Id, cancellationToken);

            return result.IsDuplicate
                ? Result<CreateInvoiceResult>.Success(result)
                : Result<CreateInvoiceResult>.Created(result);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.InvoiceNotFound)
        {
            return Result<CreateInvoiceResult>.NotFound(ErrorMessages.Invoice.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.InvoiceCannotStorno)
        {
            return Result<CreateInvoiceResult>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<CreateInvoiceResult>.Failure(ex.Message);
        }
    }
}
