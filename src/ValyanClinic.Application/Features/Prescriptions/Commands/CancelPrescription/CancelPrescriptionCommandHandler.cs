using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.CancelPrescription;

public sealed class CancelPrescriptionCommandHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CancelPrescriptionCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(CancelPrescriptionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.CancelAsync(
                request.Id, currentUser.ClinicId, request.Reason.Trim(), currentUser.Id, cancellationToken);
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
