namespace ValyanClinic.Application.Features.Prescriptions.DTOs;

/// <summary>Tip de afecțiune (acut / subacut / cronic) cu durata maximă și valabilitatea rețetei.</summary>
public sealed class PrescriptionCareTypeLookupDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int MaxDays { get; init; }
    public int ValidityDays { get; init; }
}
