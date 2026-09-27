using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Payments.DTOs;

namespace ValyanClinic.Application.Features.Payments.Commands.CreatePayment;

public sealed class CreatePaymentCommandHandler(
    IPaymentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreatePaymentCommand, Result<CreatePaymentResult>>
{
    public async Task<Result<CreatePaymentResult>> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await repository.CreateAsync(
                currentUser.ClinicId,
                request.ConsultationId,
                request.IdempotencyKey,
                request.Tenders,
                string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                currentUser.Id,
                cancellationToken);

            return result.IsDuplicate
                ? Result<CreatePaymentResult>.Success(result)
                : Result<CreatePaymentResult>.Created(result);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<CreatePaymentResult>.NotFound(ErrorMessages.Consultation.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.PaymentAlreadyPaid)
        {
            return Result<CreatePaymentResult>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<CreatePaymentResult>.Failure(ex.Message);
        }
    }
}
