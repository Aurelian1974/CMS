using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultationAnamnesis;

/// <summary>Actualizare (upsert) sec\u021biunea Anamnez\u0103 a unei consulta\u021bii.</summary>
public sealed record UpdateConsultationAnamnesisCommand(
    Guid ConsultationId,
    string? Motiv,
    string? IstoricMedicalPersonal,
    string? TratamentAnterior,
    string? IstoricBoalaActuala,
    string? IstoricFamilial,
    string? FactoriDeRisc,
    string? AlergiiConsultatie
) : IRequest<Result<bool>>;
