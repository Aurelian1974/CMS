using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.DeletePrescription;

public sealed class DeletePrescriptionCommandHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeletePrescriptionCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeletePrescriptionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(request.Id, currentUser.ClinicId, currentUser.Id, cancellationToken);
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
