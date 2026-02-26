namespace ValyanClinic.Application.Features.Patients.DTOs;

/// <summary>DTO listare pacient — include nr. alergii, severitate maximă și doctor primar.</summary>
public sealed class PatientListDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string? PatientCode { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? Cnp { get; init; }
    public DateTime? BirthDate { get; init; }
    public int? Age { get; init; }
    public Guid? GenderId { get; init; }
    public string? GenderName { get; init; }
    public Guid? BloodTypeId { get; init; }
    public string? BloodTypeName { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
    public string? Address { get; init; }
    public string? InsuranceNumber { get; init; }
    public DateTime? InsuranceExpiry { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }

    // Calculat din subquery-uri SP
    public int AllergyCount { get; init; }
    public string? MaxAllergySeverityCode { get; init; }
    public string? PrimaryDoctorName { get; init; }
}
