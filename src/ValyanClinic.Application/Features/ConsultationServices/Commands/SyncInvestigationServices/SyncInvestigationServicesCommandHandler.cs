using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.SyncInvestigationServices;

public sealed class SyncInvestigationServicesCommandHandler(
    IConsultationServiceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<SyncInvestigationServicesCommand, Result<int>>
{
    public async Task<Result<int>> Handle(SyncInvestigationServicesCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var added = await repository.SyncFromInvestigationsAsync(
                request.ConsultationId, currentUser.ClinicId, currentUser.Id, cancellationToken);
            return Result<int>.Success(added);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<int>.NotFound(ErrorMessages.Consultation.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.BillingConsultationLocked)
        {
            return Result<int>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<int>.Failure(ex.Message);
        }
    }
}
