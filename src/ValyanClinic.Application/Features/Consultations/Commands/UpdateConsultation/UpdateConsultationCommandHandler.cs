using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultation;

public sealed class UpdateConsultationCommandHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateConsultationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateConsultationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var data = new ConsultationUpdateData(
                Id: request.Id,
                ClinicId: currentUser.ClinicId,
                PatientId: request.PatientId,
                DoctorId: request.DoctorId,
                AppointmentId: request.AppointmentId,
                Date: request.Date,
                Investigatii: request.Investigatii,
                AnalizeMedicale: request.AnalizeMedicale,
                Diagnostic: request.Diagnostic,
                DiagnosticCodes: request.DiagnosticCodes,
                Recomandari: request.Recomandari,
                Observatii: request.Observatii,
                Concluzii: request.Concluzii,
                EsteAfectiuneOncologica: request.EsteAfectiuneOncologica,
                AreIndicatieInternare: request.AreIndicatieInternare,
                SaEliberatPrescriptie: request.SaEliberatPrescriptie,
                SeriePrescriptie: request.SeriePrescriptie,
                SaEliberatConcediuMedical: request.SaEliberatConcediuMedical,
                SerieConcediuMedical: request.SerieConcediuMedical,
                SaEliberatIngrijiriDomiciliu: request.SaEliberatIngrijiriDomiciliu,
                SaEliberatDispozitiveMedicale: request.SaEliberatDispozitiveMedicale,
                DataUrmatoareiVizite: request.DataUrmatoareiVizite,
                NoteUrmatoareaVizita: request.NoteUrmatoareaVizita,
                StatusId: request.StatusId);

            await repository.UpdateAsync(data, currentUser.Id, cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Consultation.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
