namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Entitate Domain pentru personal medical non-doctor (asistenți, infirmieri, moașe etc.).
/// Un membru aparține unei clinici, poate fi alocat unui departament,
/// are un doctor supervizor și o titulatură medicală.
/// </summary>
public sealed class MedicalStaffMember
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid? DepartmentId { get; set; }
    public Guid? SupervisorDoctorId { get; set; }
    public Guid? MedicalTitleId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public Guid CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
