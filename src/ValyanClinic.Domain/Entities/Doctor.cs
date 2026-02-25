namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Entitate Domain pentru doctor / medic al clinicii.
/// Un doctor aparține unei clinici, poate fi alocat unui departament,
/// are un supervizor ierarhic, o specializare și opțional o subspecializare.
/// </summary>
public sealed class Doctor
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid? DepartmentId { get; set; }
    public Guid? SupervisorDoctorId { get; set; }
    public Guid? SpecialtyId { get; set; }
    public Guid? SubspecialtyId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? MedicalCode { get; set; }
    public string? LicenseNumber { get; set; }
    public DateOnly? LicenseExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
