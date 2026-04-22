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
            await repository.UpdateAsync(
                request.Id,
                currentUser.ClinicId,
                request.PatientId,
                request.DoctorId,
                request.AppointmentId,
                request.Date,
                request.Motiv,
                request.IstoricMedicalPersonal,
                request.TratamentAnterior,
                request.IstoricBoalaActuala,
                request.IstoricFamilial,
                request.FactoriDeRisc,
                request.AlergiiConsultatie,
                request.StareGenerala,
                request.Tegumente,
                request.Mucoase,
                request.Greutate,
                request.Inaltime,
                request.TensiuneSistolica,
                request.TensiuneDiastolica,
                request.Puls,
                request.FrecventaRespiratorie,
                request.Temperatura,
                request.SpO2,
                request.Edeme,
                request.Glicemie,
                request.GanglioniLimfatici,
                request.ExamenClinic,
                request.AlteObservatiiClinice,
                request.Investigatii,
                request.AnalizeMedicale,
                request.Diagnostic,
                request.DiagnosticCodes,
                request.Recomandari,
                request.Observatii,
                request.Concluzii,
                request.EsteAfectiuneOncologica,
                request.AreIndicatieInternare,
                request.SaEliberatPrescriptie,
                request.SeriePrescriptie,
                request.SaEliberatConcediuMedical,
                request.SerieConcediuMedical,
                request.SaEliberatIngrijiriDomiciliu,
                request.SaEliberatDispozitiveMedicale,
                request.DataUrmatoareiVizite,
                request.NoteUrmatoareaVizita,
                request.StatusId,
                currentUser.Id,
                cancellationToken);

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
