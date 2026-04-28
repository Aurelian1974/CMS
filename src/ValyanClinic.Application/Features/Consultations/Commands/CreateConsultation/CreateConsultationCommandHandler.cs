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
            var data = new ConsultationCreateData(
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

            var id = await repository.CreateAsync(data, currentUser.Id, cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
