using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Investigations.Commands.CreateInvestigation;

public sealed class CreateInvestigationCommandHandler(
    IInvestigationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateInvestigationCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateInvestigationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var data = new InvestigationCreateData(
                ClinicId: currentUser.ClinicId,
                ConsultationId: request.ConsultationId,
                PatientId: request.PatientId,
                DoctorId: request.DoctorId,
                InvestigationType: request.InvestigationType,
                InvestigationDate: request.InvestigationDate,
                StructuredData: request.StructuredData,
                Narrative: request.Narrative,
                IsExternal: request.IsExternal,
                ExternalSource: request.ExternalSource,
                Status: request.Status,
                AttachedDocumentId: request.AttachedDocumentId,
                HasStructuredData: request.HasStructuredData);

            var id = await repository.CreateAsync(data, currentUser.Id, cancellationToken);
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
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.InvestigationTypeInvalid)
        {
            return Result<Guid>.Failure(ErrorMessages.Investigation.TypeInvalid);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
