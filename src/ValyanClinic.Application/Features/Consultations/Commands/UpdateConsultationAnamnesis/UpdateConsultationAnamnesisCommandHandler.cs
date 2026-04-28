using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultationAnamnesis;

public sealed class UpdateConsultationAnamnesisCommandHandler(
    IConsultationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateConsultationAnamnesisCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateConsultationAnamnesisCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var dto = new ConsultationAnamnesisDto
            {
                Motiv = request.Motiv,
                IstoricMedicalPersonal = request.IstoricMedicalPersonal,
                TratamentAnterior = request.TratamentAnterior,
                IstoricBoalaActuala = request.IstoricBoalaActuala,
                IstoricFamilial = request.IstoricFamilial,
                FactoriDeRisc = request.FactoriDeRisc,
                AlergiiConsultatie = request.AlergiiConsultatie,
            };

            await repository.UpsertAnamnesisAsync(
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
