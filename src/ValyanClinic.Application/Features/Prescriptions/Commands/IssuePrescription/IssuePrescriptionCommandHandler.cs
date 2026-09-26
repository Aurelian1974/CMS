using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.IssuePrescription;

public sealed class IssuePrescriptionCommandHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<IssuePrescriptionCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(IssuePrescriptionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.IssueAsync(request.Id, currentUser.ClinicId, currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.PrescriptionNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Prescription.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
