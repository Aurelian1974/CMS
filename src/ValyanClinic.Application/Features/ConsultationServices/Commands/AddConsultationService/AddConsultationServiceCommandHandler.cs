using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ConsultationServices.Commands.AddConsultationService;

public sealed class AddConsultationServiceCommandHandler(
    IConsultationServiceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<AddConsultationServiceCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddConsultationServiceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.AddAsync(
                currentUser.ClinicId, request.ConsultationId, request.MedicalServiceId, request.Quantity,
                currentUser.Id, cancellationToken);
            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<Guid>.NotFound(ErrorMessages.Consultation.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.BillingConsultationLocked)
        {
            return Result<Guid>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
