using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultation;

/// <summary>
/// Actualizare header + tab-urile încă pe coloane vechi (Investigații / Analize / Diagnostic / Concluzii).
/// Tab-urile Anamneză și Examen Clinic au endpoint-uri dedicate.
/// </summary>
public sealed record UpdateConsultationCommand(
    Guid Id,
    Guid PatientId,
    Guid DoctorId,
    Guid? AppointmentId,
    DateTime Date,
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
