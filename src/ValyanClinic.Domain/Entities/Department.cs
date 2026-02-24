namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Entitate Domain pentru departament / secție a clinicii.
/// Un departament aparține unei locații fizice și poate avea un șef ierarhic (doctor).
/// </summary>
public sealed class Department
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid LocationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? HeadDoctorId { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; set; }
}
