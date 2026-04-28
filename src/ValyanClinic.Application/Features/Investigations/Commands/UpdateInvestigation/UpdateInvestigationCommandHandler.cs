using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Investigations.Commands.UpdateInvestigation;

public sealed class UpdateInvestigationCommandHandler(
    IInvestigationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateInvestigationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateInvestigationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var data = new InvestigationUpdateData(
                Id: request.Id,
                ClinicId: currentUser.ClinicId,
                InvestigationDate: request.InvestigationDate,
                StructuredData: request.StructuredData,
                Narrative: request.Narrative,
                IsExternal: request.IsExternal,
                ExternalSource: request.ExternalSource,
                Status: request.Status,
                AttachedDocumentId: request.AttachedDocumentId,
                HasStructuredData: request.HasStructuredData);

            await repository.UpdateAsync(data, currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.InvestigationNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Investigation.NotFound);
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
