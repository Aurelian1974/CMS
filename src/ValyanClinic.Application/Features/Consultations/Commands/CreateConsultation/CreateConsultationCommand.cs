using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Consultations.Commands.CreateConsultation;

/// <summary>
/// Creare consultație nouă (header + tab-urile încă pe coloane vechi).
/// Tab-urile Anamneză și Examen Clinic se actualizează separat după creare,
/// prin endpoint-urile dedicate <c>UpdateConsultationAnamnesis</c> / <c>UpdateConsultationExam</c>.
/// </summary>
public sealed record CreateConsultationCommand(
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
) : IRequest<Result<Guid>>;
