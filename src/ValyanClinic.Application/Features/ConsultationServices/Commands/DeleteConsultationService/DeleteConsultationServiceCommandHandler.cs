using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.DeleteConsultationService;

public sealed class DeleteConsultationServiceCommandHandler(
    IConsultationServiceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteConsultationServiceCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeleteConsultationServiceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(request.Id, currentUser.ClinicId, currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationServiceNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Billing.ConsultationServiceNotFound);
        }
        catch (SqlException ex) when (ex.Number is SqlErrorCodes.BillingConsultationLocked
                                          or SqlErrorCodes.ConsultationServiceFromInvestigation)
        {
            return Result<bool>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
