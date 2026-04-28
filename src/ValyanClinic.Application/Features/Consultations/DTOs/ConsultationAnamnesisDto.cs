namespace ValyanClinic.Application.Features.Consultations.DTOs;

/// <summary>Sec\u021biunea Anamnez\u0103 (Tab 1) a unei consulta\u021bii.</summary>
public sealed class ConsultationAnamnesisDto
{
    public string? Motiv { get; init; }
    public string? IstoricMedicalPersonal { get; init; }
    public string? TratamentAnterior { get; init; }
    public string? IstoricBoalaActuala { get; init; }
    public string? IstoricFamilial { get; init; }
    public string? FactoriDeRisc { get; init; }
    public string? AlergiiConsultatie { get; init; }
}
