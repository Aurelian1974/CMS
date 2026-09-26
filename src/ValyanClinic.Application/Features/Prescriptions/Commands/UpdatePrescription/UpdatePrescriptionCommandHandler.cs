using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.UpdatePrescription;

public sealed class UpdatePrescriptionCommandHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdatePrescriptionCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdatePrescriptionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                new PrescriptionUpdateData(
                    Id: request.Id,
                    ClinicId: currentUser.ClinicId,
                    CareTypeId: request.CareTypeId,
                    InsuredCategoryId: request.InsuredCategoryId,
                    TreatmentDays: request.TreatmentDays,
                    Diagnostic: request.Diagnostic,
                    DiagnosticCodes: request.DiagnosticCodes,
                    RegistryNumber: request.RegistryNumber,
                    IsContinuation: request.IsContinuation,
                    ReferralLetterNumber: request.ReferralLetterNumber,
                    Notes: request.Notes,
                    Items: request.Items),
                currentUser.Id,
                cancellationToken);

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
