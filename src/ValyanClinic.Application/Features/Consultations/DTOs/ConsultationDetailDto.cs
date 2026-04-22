namespace ValyanClinic.Application.Features.Consultations.DTOs;

/// <summary>DTO detaliat pentru o consultație individuală.</summary>
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

    // Tab 1: Anamneză
    public string? Motiv { get; init; }
    public string? IstoricMedicalPersonal { get; init; }
    public string? TratamentAnterior { get; init; }
    public string? IstoricBoalaActuala { get; init; }
    public string? IstoricFamilial { get; init; }
    public string? FactoriDeRisc { get; init; }
    public string? AlergiiConsultatie { get; init; }

    // Tab 2: Examen Clinic
    public string? StareGenerala { get; init; }
    public string? Tegumente { get; init; }
    public string? Mucoase { get; init; }
    public decimal? Greutate { get; init; }
    public int? Inaltime { get; init; }
    public int? TensiuneSistolica { get; init; }
    public int? TensiuneDiastolica { get; init; }
    public int? Puls { get; init; }
    public int? FrecventaRespiratorie { get; init; }
    public decimal? Temperatura { get; init; }
    public int? SpO2 { get; init; }
    public string? Edeme { get; init; }
    public decimal? Glicemie { get; init; }
    public string? GanglioniLimfatici { get; init; }
    public string? ExamenClinic { get; init; }
    public string? AlteObservatiiClinice { get; init; }

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
