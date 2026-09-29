namespace ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

/// <summary>DTO detalii personal administrativ.</summary>
public sealed class AdministrativeStaffDetailDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid? DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
    public Guid? PositionId { get; init; }
    public string? PositionName { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
