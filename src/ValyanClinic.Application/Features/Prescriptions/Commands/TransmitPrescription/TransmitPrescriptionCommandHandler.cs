using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.TransmitPrescription;

public sealed class TransmitPrescriptionCommandHandler(
    IPrescriptionRepository repository,
    ISipeClient sipeClient,
    ICurrentUser currentUser)
    : IRequestHandler<TransmitPrescriptionCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(TransmitPrescriptionCommand request, CancellationToken cancellationToken)
    {
        if (!sipeClient.IsEnabled)
            return Result<bool>.Failure(ErrorMessages.Prescription.SipeNotConfigured);

        var prescription = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);
        if (prescription is null)
            return Result<bool>.NotFound(ErrorMessages.Prescription.NotFound);

        if (!prescription.IsCnas || prescription.StatusCode != PrescriptionStatusCodes.Issued)
            return Result<bool>.Failure(ErrorMessages.Prescription.NotTransmittable);

        try
        {
            var result = await sipeClient.TransmitAsync(prescription, cancellationToken);

            // Eroarea SIPE se salvează pe rețetă, ca medicul să o vadă și să retransmită
            await repository.SetTransmissionAsync(
                prescription.Id,
                currentUser.ClinicId,
                result.IsSuccess ? result.ElectronicId : null,
                result.IsOffline,
                result.IsSuccess ? null : result.ErrorMessage,
                currentUser.Id,
                cancellationToken);

            return result.IsSuccess
                ? Result<bool>.Success(true)
                : Result<bool>.Failure(string.Format(ErrorMessages.Prescription.SipeTransmissionFailed, result.ErrorMessage));
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
