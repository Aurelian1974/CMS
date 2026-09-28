using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.FinalizeConsultation;

public sealed class FinalizeConsultationCommandHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<FinalizeConsultationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        FinalizeConsultationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.FinalizeAsync(
                request.Id,
                currentUser.ClinicId,
                currentUser.Id,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Consultation.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationLocked)
        {
            return Result<bool>.Conflict(ErrorMessages.Consultation.Locked);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationMissingPrimaryDiagnosis)
        {
            return Result<bool>.Failure(ErrorMessages.Consultation.MissingPrimaryDiagnosis);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
