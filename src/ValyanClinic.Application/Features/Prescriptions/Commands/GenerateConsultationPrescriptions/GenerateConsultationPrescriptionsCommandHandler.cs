using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.GenerateConsultationPrescriptions;

public sealed class GenerateConsultationPrescriptionsCommandHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GenerateConsultationPrescriptionsCommand, Result<IReadOnlyList<Guid>>>
{
    public async Task<Result<IReadOnlyList<Guid>>> Handle(
        GenerateConsultationPrescriptionsCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var ids = await repository.GenerateFromConsultationAsync(
                request.ConsultationId,
                currentUser.ClinicId,
                request.CareTypeId,
                request.InsuredCategoryId,
                request.TreatmentDays,
                currentUser.Id,
                cancellationToken);

            return Result<IReadOnlyList<Guid>>.Created(ids);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<IReadOnlyList<Guid>>.NotFound(ErrorMessages.Consultation.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<IReadOnlyList<Guid>>.Failure(ex.Message);
        }
    }
}
