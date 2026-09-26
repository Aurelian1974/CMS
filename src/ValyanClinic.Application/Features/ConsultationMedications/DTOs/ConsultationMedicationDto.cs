namespace ValyanClinic.Application.Features.ConsultationMedications.DTOs;

/// <summary>Medicament din tratamentul recomandat al unei consultații.</summary>
public sealed record ConsultationMedicationDto
{
    public Guid Id { get; init; }
    public Guid ConsultationId { get; init; }
    public Guid PatientId { get; init; }
    public string DrugCode { get; init; } = string.Empty;
    public string DrugName { get; init; } = string.Empty;
    public string? ActiveSubstance { get; init; }
    public string? PharmaceuticalForm { get; init; }
    public string? Concentration { get; init; }
    public string? PrescriptionMode { get; init; }
    /// <summary>Lista de compensare aleasă (A, B, C1...); null = necompensat.</summary>
    public string? CopaymentListType { get; init; }
    public bool IsCompensated { get; init; }
    /// <summary>Listele CNAS active pe care medicamentul e compensat, separate prin virgulă.</summary>
    public string? AvailableCopaymentLists { get; init; }
    /// <summary>Doza per priză pe momente ale zilei; null = moment nebifat.</summary>
    public decimal? DoseMorning { get; init; }
    public decimal? DoseAfternoon { get; init; }
    public decimal? DoseEvening { get; init; }
    public int? DurationDays { get; init; }
    /// <summary>Calculat în BD: suma dozelor zilnice × zile.</summary>
    public decimal? TotalQuantity { get; init; }
    public string? Notes { get; init; }
    public int SortOrder { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
