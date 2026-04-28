namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Sec\u021biunea Anamnez\u0103 a unei consulta\u021bii (Tab 1). Rela\u021bie 1:0..1 cu <see cref="Consultation"/>.
/// </summary>
public sealed class ConsultationAnamnesis
{
    public Guid ConsultationId { get; init; }
    public string? Motiv { get; set; }
    public string? IstoricMedicalPersonal { get; set; }
    public string? TratamentAnterior { get; set; }
    public string? IstoricBoalaActuala { get; set; }
    public string? IstoricFamilial { get; set; }
    public string? FactoriDeRisc { get; set; }
    public string? AlergiiConsultatie { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
