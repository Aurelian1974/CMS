namespace ValyanClinic.Application.Features.Clinics.DTOs;

public sealed class ClinicContactDto
{
    public Guid Id { get; set; }
    public Guid ClinicId { get; set; }
    public string ContactType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Label { get; set; }
    public bool IsMain { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
