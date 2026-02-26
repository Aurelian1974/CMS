namespace ValyanClinic.Application.Features.Patients.DTOs;

/// <summary>DTO alergie pacient — include denumirile tip/severitate.</summary>
public sealed class PatientAllergyDto
{
    public Guid Id { get; init; }
    public Guid AllergyTypeId { get; init; }
    public string AllergyTypeName { get; init; } = string.Empty;
    public string AllergyTypeCode { get; init; } = string.Empty;
    public Guid AllergySeverityId { get; init; }
    public string AllergySeverityName { get; init; } = string.Empty;
    public string AllergySeverityCode { get; init; } = string.Empty;
    public string AllergenName { get; init; } = string.Empty;
    public string? Reaction { get; init; }
    public DateTime? OnsetDate { get; init; }
    public string? Notes { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
