using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.CreatePrescriptions;

public sealed class CreatePrescriptionsCommandHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreatePrescriptionsCommand, Result<IReadOnlyList<Guid>>>
{
    public async Task<Result<IReadOnlyList<Guid>>> Handle(
        CreatePrescriptionsCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var ids = await repository.CreateAsync(
                new PrescriptionCreateData(
                    ClinicId: currentUser.ClinicId,
                    PatientId: request.PatientId,
                    DoctorId: request.DoctorId,
                    ConsultationId: request.ConsultationId,
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

            return Result<IReadOnlyList<Guid>>.Created(ids);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<IReadOnlyList<Guid>>.Failure(ex.Message);
        }
    }
}
