namespace ValyanClinic.Application.Features.Departments.DTOs;

/// <summary>DTO pentru departament — include denumirea locației și numele șefului.</summary>
public sealed class DepartmentDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid LocationId { get; init; }
    public string LocationName { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid? HeadDoctorId { get; init; }
    public string? HeadDoctorName { get; init; }
    public int DoctorCount { get; init; }
    public int MedicalStaffCount { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
