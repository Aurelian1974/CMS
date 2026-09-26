namespace ValyanClinic.Application.Features.ConsultationMedications.DTOs;

/// <summary>Medicament CNAS returnat de căutarea pentru prescriere.</summary>
public sealed record CnasDrugLookupDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? ActiveSubstanceCode { get; init; }
    public string? PharmaceuticalForm { get; init; }
    public string? Concentration { get; init; }
    public string? PresentationMode { get; init; }
    public string? PrescriptionMode { get; init; }
    public decimal? PricePerPackage { get; init; }
    public bool IsCompensated { get; init; }
    /// <summary>Listele CNAS active pe care medicamentul e compensat, separate prin virgulă.</summary>
    public string? CopaymentLists { get; init; }
}
