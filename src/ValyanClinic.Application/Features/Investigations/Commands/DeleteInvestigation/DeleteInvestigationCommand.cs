using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Investigations.Commands.DeleteInvestigation;

public sealed record DeleteInvestigationCommand(Guid Id) : IRequest<Result<bool>>;

public sealed class DeleteInvestigationCommandHandler(
    IInvestigationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteInvestigationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeleteInvestigationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(request.Id, currentUser.ClinicId, currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.InvestigationNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Investigation.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationLocked)
        {
            return Result<bool>.Failure(ErrorMessages.Consultation.Locked);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
