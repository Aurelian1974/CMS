using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.AnalysesResults.Commands.DeleteAnalysesResult;

public sealed class DeleteAnalysesResultCommandHandler(
    IAnalysesResultRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteAnalysesResultCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteAnalysesResultCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(request.Id, currentUser.ClinicId, currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AnalysesResultNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.AnalysesResult.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
