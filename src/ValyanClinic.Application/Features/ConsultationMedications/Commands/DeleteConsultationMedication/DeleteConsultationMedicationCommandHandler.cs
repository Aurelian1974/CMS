using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationMedications.Commands.DeleteConsultationMedication;

public sealed class DeleteConsultationMedicationCommandHandler(
    IConsultationMedicationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteConsultationMedicationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeleteConsultationMedicationCommand request, CancellationToken ct)
    {
        try
        {
            await repository.DeleteAsync(request.Id, currentUser.ClinicId, currentUser.Id, ct);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationMedicationNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.ConsultationMedication.NotFound);
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
