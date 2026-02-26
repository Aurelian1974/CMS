namespace ValyanClinic.Application.Features.Patients.DTOs;

/// <summary>Statistici globale pacienți — result set 3 din Patient_GetPaged.</summary>
public sealed class PatientStatsDto
{
    public int TotalPatients { get; init; }
    public int ActivePatients { get; init; }
    public int PatientsWithAllergies { get; init; }
    public int NewThisMonth { get; init; }
}
