using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultationExam;

/// <summary>Actualizare (upsert) sec\u021biunea Examen Clinic a unei consulta\u021bii.</summary>
public sealed record UpdateConsultationExamCommand(
    Guid ConsultationId,
    string? StareGenerala,
    string? Tegumente,
    string? Mucoase,
    decimal? Greutate,
    int? Inaltime,
    int? TensiuneSistolica,
    int? TensiuneDiastolica,
    int? Puls,
    int? FrecventaRespiratorie,
    decimal? Temperatura,
    int? SpO2,
    string? Edeme,
    decimal? Glicemie,
    string? GanglioniLimfatici,
    string? ExamenClinic,
    string? AlteObservatiiClinice
) : IRequest<Result<bool>>;
