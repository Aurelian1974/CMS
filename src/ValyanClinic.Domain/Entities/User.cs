namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Entitate Domain pentru utilizator al clinicii.
/// Un utilizator este ÎNTOTDEAUNA asociat fie unui Doctor, fie unui MedicalStaff.
/// Parolele se stochează hash-uite (BCrypt).
/// </summary>
public sealed class User
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid RoleId { get; set; }
    public Guid? DoctorId { get; set; }
    public Guid? MedicalStaffId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockoutEnd { get; set; }
    public DateTime CreatedAt { get; init; }
    public Guid? CreatedBy { get; init; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
