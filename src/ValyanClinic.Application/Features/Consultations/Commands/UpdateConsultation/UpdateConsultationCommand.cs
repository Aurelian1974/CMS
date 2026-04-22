using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultation;

/// <summary>Actualizare consultație existentă.</summary>
public sealed record UpdateConsultationCommand(
    Guid Id,
    Guid PatientId,
    Guid DoctorId,
    Guid? AppointmentId,
    DateTime Date,
    // Tab 1: Anamneză
    string? Motiv,
    string? IstoricMedicalPersonal,
    string? TratamentAnterior,
    string? IstoricBoalaActuala,
    string? IstoricFamilial,
    string? FactoriDeRisc,
    string? AlergiiConsultatie,
    // Tab 2: Examen Clinic
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
    string? AlteObservatiiClinice,
    // Tab 3: Investigații
    string? Investigatii,
    // Tab 4: Analize Medicale
    string? AnalizeMedicale,
    // Tab 5: Diagnostic & Tratament
    string? Diagnostic,
    string? DiagnosticCodes,
    string? Recomandari,
    string? Observatii,
    // Tab 6: Concluzii
    string? Concluzii,
    bool EsteAfectiuneOncologica,
    bool AreIndicatieInternare,
    bool SaEliberatPrescriptie,
    string? SeriePrescriptie,
    bool SaEliberatConcediuMedical,
    string? SerieConcediuMedical,
    bool SaEliberatIngrijiriDomiciliu,
    bool SaEliberatDispozitiveMedicale,
    DateTime? DataUrmatoareiVizite,
    string? NoteUrmatoareaVizita,
    Guid? StatusId
) : IRequest<Result<bool>>;
