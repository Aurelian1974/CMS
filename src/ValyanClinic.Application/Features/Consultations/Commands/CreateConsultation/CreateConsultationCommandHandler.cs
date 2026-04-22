using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.CreateConsultation;

public sealed class CreateConsultationCommandHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateConsultationCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateConsultationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
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

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
