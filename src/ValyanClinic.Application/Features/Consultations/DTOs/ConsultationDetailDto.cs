namespace ValyanClinic.Application.Features.Consultations.DTOs;

/// <summary>DTO detaliat pentru o consulta\u021bie individual\u0103.</summary>
/// <remarks>
/// Sec\u021biunile per-tab sunt expuse ca sub-obiecte (ierarhic):
///   - <see cref="Anamnesis"/> (Tab 1)
///   - <see cref="Exam"/> (Tab 2)
/// Restul tab-urilor (Investiga\u021bii / Analize / Diagnostic / Concluzii) r\u0103m\u00e2n temporar
/// pe c\u00e2mpuri flat p\u00e2n\u0103 la finalizarea refactor-ului.
/// </remarks>
public sealed class ConsultationDetailDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string? PatientPhone { get; init; }
    public string? PatientCnp { get; init; }
    public string? PatientEmail { get; init; }
    public DateTime? PatientBirthDate { get; init; }
    public string? PatientGender { get; init; }
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string? SpecialtyName { get; init; }
    public string? DoctorMedicalCode { get; init; }
    public Guid? AppointmentId { get; init; }
    public DateTime Date { get; init; }

    // Tab 1: Anamneză (sub-obiect, null dacă nu există secțiune)
    public ConsultationAnamnesisDto? Anamnesis { get; init; }

    // Tab 2: Examen Clinic (sub-obiect, null dacă nu există secțiune)
    public ConsultationExamDto? Exam { get; init; }

    // Tab 3: Investigații
    public string? Investigatii { get; init; }

    // Tab 4: Analize Medicale
    public string? AnalizeMedicale { get; init; }

    // Tab 5: Diagnostic & Tratament
    public string? Diagnostic { get; init; }
    public string? DiagnosticCodes { get; init; }
    public string? Recomandari { get; init; }
    public string? Observatii { get; init; }

    // Tab 6: Concluzii
    public string? Concluzii { get; init; }
    public bool EsteAfectiuneOncologica { get; init; }
    public bool AreIndicatieInternare { get; init; }
    public bool SaEliberatPrescriptie { get; init; }
    public string? SeriePrescriptie { get; init; }
    public bool SaEliberatConcediuMedical { get; init; }
    public string? SerieConcediuMedical { get; init; }
    public bool SaEliberatIngrijiriDomiciliu { get; init; }
    public bool SaEliberatDispozitiveMedicale { get; init; }
    public DateTime? DataUrmatoareiVizite { get; init; }
    public string? NoteUrmatoareaVizita { get; init; }

    public Guid StatusId { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public string StatusCode { get; init; } = string.Empty;
    public bool IsDeleted { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public Guid? UpdatedBy { get; init; }
    public string? UpdatedByName { get; init; }
}
