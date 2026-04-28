namespace ValyanClinic.Application.Features.Consultations.DTOs;

/// <summary>Sec\u021biunea Examen Clinic (Tab 2) a unei consulta\u021bii.</summary>
public sealed class ConsultationExamDto
{
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
}
