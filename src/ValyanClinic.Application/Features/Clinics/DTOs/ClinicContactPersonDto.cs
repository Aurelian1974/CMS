namespace ValyanClinic.Application.Features.Clinics.DTOs;

public sealed class ClinicContactPersonDto
{
    public Guid Id { get; set; }
    public Guid ClinicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Function { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public bool IsMain { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
