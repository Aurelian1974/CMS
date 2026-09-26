namespace ValyanClinic.Application.Features.Prescriptions.DTOs;

/// <summary>Medicament de pe o rețetă (snapshot la momentul prescrierii).</summary>
public sealed class PrescriptionItemDto
{
    public Guid Id { get; init; }
    public Guid PrescriptionId { get; init; }
    public Guid? ConsultationMedicationId { get; init; }
    public string? DrugCode { get; init; }
    public string DrugName { get; init; } = string.Empty;
    public string? ActiveSubstance { get; init; }
    public string? PharmaceuticalForm { get; init; }
    public string? Concentration { get; init; }
    public string? PrescriptionMode { get; init; }
    public string? CopaymentListType { get; init; }
    public decimal? CopaymentPercent { get; init; }
    /// <summary>Listele CNAS active pe care medicamentul e compensat, separate prin virgulă.</summary>
    public string? AvailableCopaymentLists { get; init; }
    public string? DiagnosisCode { get; init; }
    public decimal? DoseMorning { get; init; }
    public decimal? DoseAfternoon { get; init; }
    public decimal? DoseEvening { get; init; }
    public int? DurationDays { get; init; }
    public decimal? Quantity { get; init; }
    public string? Instructions { get; init; }
    public int SortOrder { get; init; }
}
