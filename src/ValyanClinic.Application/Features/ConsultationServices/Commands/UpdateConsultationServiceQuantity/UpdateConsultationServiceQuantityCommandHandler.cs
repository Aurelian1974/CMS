using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.UpdateConsultationServiceQuantity;

public sealed class UpdateConsultationServiceQuantityCommandHandler(
    IConsultationServiceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateConsultationServiceQuantityCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateConsultationServiceQuantityCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateQuantityAsync(
                request.Id, currentUser.ClinicId, request.Quantity, currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationServiceNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Billing.ConsultationServiceNotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.BillingConsultationLocked)
        {
            return Result<bool>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
