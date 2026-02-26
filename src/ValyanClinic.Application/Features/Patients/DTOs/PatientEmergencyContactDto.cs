namespace ValyanClinic.Application.Features.Patients.DTOs;

/// <summary>DTO contact urgență pacient.</summary>
public sealed class PatientEmergencyContactDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Relationship { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public bool IsDefault { get; init; }
    public string? Notes { get; init; }
    public bool IsActive { get; init; }
}
