namespace ValyanClinic.Application.Features.Users.DTOs;

/// <summary>DTO detalii utilizator — include toate câmpurile + audit.</summary>
public sealed class UserDetailDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid RoleId { get; init; }
    public string RoleName { get; init; } = string.Empty;
    public string RoleCode { get; init; } = string.Empty;
    public Guid? DoctorId { get; init; }
    public string? DoctorName { get; init; }
    public Guid? MedicalStaffId { get; init; }
    public string? MedicalStaffName { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public int FailedLoginAttempts { get; init; }
    public DateTime? LockoutEnd { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
