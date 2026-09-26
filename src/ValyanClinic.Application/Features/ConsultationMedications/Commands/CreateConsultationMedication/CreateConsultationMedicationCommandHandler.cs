using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationMedications.Commands.CreateConsultationMedication;

public sealed class CreateConsultationMedicationCommandHandler(
    IConsultationMedicationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateConsultationMedicationCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateConsultationMedicationCommand request, CancellationToken ct)
    {
        try
        {
            var data = new ConsultationMedicationCreateData(
                ClinicId: currentUser.ClinicId,
                ConsultationId: request.ConsultationId,
                DrugCode: request.DrugCode,
                CopaymentListType: request.CopaymentListType,
                DoseMorning: request.DoseMorning,
                DoseAfternoon: request.DoseAfternoon,
                DoseEvening: request.DoseEvening,
                DurationDays: request.DurationDays,
                Notes: request.Notes);

            var id = await repository.CreateAsync(data, currentUser.Id, ct);
            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<Guid>.NotFound(ErrorMessages.Consultation.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationLocked)
        {
            return Result<Guid>.Failure(ErrorMessages.Consultation.Locked);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.CnasDrugNotFound)
        {
            return Result<Guid>.NotFound(ErrorMessages.ConsultationMedication.DrugNotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.CopaymentListInvalid)
        {
            return Result<Guid>.Failure(ErrorMessages.ConsultationMedication.CopaymentListInvalid);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
