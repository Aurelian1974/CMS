namespace ValyanClinic.Application.Features.Prescriptions.DTOs;

/// <summary>Nomenclatoarele rețetelor, încărcate o singură dată pentru filtre și formulare.</summary>
public sealed class PrescriptionLookupsDto
{
    public IReadOnlyList<PrescriptionTypeLookupDto> Types { get; init; } = [];
    public IReadOnlyList<PrescriptionLookupItemDto> Statuses { get; init; } = [];
    public IReadOnlyList<PrescriptionCareTypeLookupDto> CareTypes { get; init; } = [];
    public IReadOnlyList<PrescriptionLookupItemDto> InsuredCategories { get; init; } = [];
}
