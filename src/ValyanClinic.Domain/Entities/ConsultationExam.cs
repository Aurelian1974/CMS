namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Sec\u021biunea Examen Clinic a unei consulta\u021bii (Tab 2). Rela\u021bie 1:0..1 cu <see cref="Consultation"/>.
/// </summary>
public sealed class ConsultationExam
{
    public Guid ConsultationId { get; init; }
    public string? StareGenerala { get; set; }
    public string? Tegumente { get; set; }
    public string? Mucoase { get; set; }
    public decimal? Greutate { get; set; }
    public int? Inaltime { get; set; }
    public int? TensiuneSistolica { get; set; }
    public int? TensiuneDiastolica { get; set; }
    public int? Puls { get; set; }
    public int? FrecventaRespiratorie { get; set; }
    public decimal? Temperatura { get; set; }
    public int? SpO2 { get; set; }
    public string? Edeme { get; set; }
    public decimal? Glicemie { get; set; }
    public string? GanglioniLimfatici { get; set; }
    public string? ExamenClinic { get; set; }
    public string? AlteObservatiiClinice { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
