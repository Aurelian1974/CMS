using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultationExam;

public sealed class UpdateConsultationExamCommandHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateConsultationExamCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateConsultationExamCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var dto = new ConsultationExamDto
            {
                StareGenerala = request.StareGenerala,
                Tegumente = request.Tegumente,
                Mucoase = request.Mucoase,
                Greutate = request.Greutate,
                Inaltime = request.Inaltime,
                TensiuneSistolica = request.TensiuneSistolica,
                TensiuneDiastolica = request.TensiuneDiastolica,
                Puls = request.Puls,
                FrecventaRespiratorie = request.FrecventaRespiratorie,
                Temperatura = request.Temperatura,
                SpO2 = request.SpO2,
                Edeme = request.Edeme,
                Glicemie = request.Glicemie,
                GanglioniLimfatici = request.GanglioniLimfatici,
                ExamenClinic = request.ExamenClinic,
                AlteObservatiiClinice = request.AlteObservatiiClinice,
            };

            await repository.UpsertExamAsync(
                request.ConsultationId,
                currentUser.ClinicId,
                dto,
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
