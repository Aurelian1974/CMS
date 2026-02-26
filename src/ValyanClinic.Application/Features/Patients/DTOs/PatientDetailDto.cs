namespace ValyanClinic.Application.Features.Patients.DTOs;

/// <summary>DTO detalii pacient — date complete fără colecții (alergii, doctori, contacte vin separat).</summary>
public sealed class PatientDetailDto
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
    public string? SecondaryPhone { get; init; }
    public string? Email { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? County { get; init; }
    public string? PostalCode { get; init; }
    public string? InsuranceNumber { get; init; }
    public DateTime? InsuranceExpiry { get; init; }
    public bool IsInsured { get; init; }
    public string? ChronicDiseases { get; init; }
    public string? FamilyDoctorName { get; init; }
    public string? Notes { get; init; }
    public bool IsActive { get; init; }
    public int TotalVisits { get; init; }
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public Guid? UpdatedBy { get; init; }
    public string? UpdatedByName { get; init; }
}
