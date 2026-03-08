namespace ValyanClinic.Application.Features.Clinics.DTOs;

public sealed class ClinicContactPersonDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Function { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
    public bool IsMain { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
