using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationMedications.Commands.UpdateConsultationMedication;

public sealed class UpdateConsultationMedicationCommandHandler(
    IConsultationMedicationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateConsultationMedicationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateConsultationMedicationCommand request, CancellationToken ct)
    {
        try
        {
            var data = new ConsultationMedicationUpdateData(
                Id: request.Id,
                ClinicId: currentUser.ClinicId,
                CopaymentListType: request.CopaymentListType,
                DoseMorning: request.DoseMorning,
                DoseAfternoon: request.DoseAfternoon,
                DoseEvening: request.DoseEvening,
                DurationDays: request.DurationDays,
                Notes: request.Notes);

            await repository.UpdateAsync(data, currentUser.Id, ct);
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
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.CopaymentListInvalid)
        {
            return Result<bool>.Failure(ErrorMessages.ConsultationMedication.CopaymentListInvalid);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
