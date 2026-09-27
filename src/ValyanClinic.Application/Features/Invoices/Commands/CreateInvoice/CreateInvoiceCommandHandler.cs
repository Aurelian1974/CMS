using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Application.Features.Invoices.Commands.CreateInvoice;

public sealed class CreateInvoiceCommandHandler(
    IInvoiceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateInvoiceCommand, Result<CreateInvoiceResult>>
{
    public async Task<Result<CreateInvoiceResult>> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await repository.CreateAsync(
                new InvoiceCreateData(
                    currentUser.ClinicId,
                    request.ConsultationId,
                    request.IdempotencyKey,
                    request.SeriesId,
                    request.CustomerIsLegalEntity,
                    request.CustomerName.Trim(),
                    !request.CustomerIsLegalEntity && request.IncludeCnp,
                    Normalize(request.CustomerFiscalCode),
                    Normalize(request.CustomerTradeRegisterNumber),
                    Normalize(request.CustomerAddress),
                    Normalize(request.CustomerCity),
                    Normalize(request.CustomerCounty),
                    request.Lines ?? []),
                currentUser.Id,
                cancellationToken);

            return result.IsDuplicate
                ? Result<CreateInvoiceResult>.Success(result)
                : Result<CreateInvoiceResult>.Created(result);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<CreateInvoiceResult>.NotFound(ErrorMessages.Consultation.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.InvoiceAlreadyExists)
        {
            return Result<CreateInvoiceResult>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<CreateInvoiceResult>.Failure(ex.Message);
        }
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
