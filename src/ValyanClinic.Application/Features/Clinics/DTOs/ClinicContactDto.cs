namespace ValyanClinic.Application.Features.Clinics.DTOs;

public sealed class ClinicContactDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string ContactType { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
    public string? Label { get; init; }
    public bool IsMain { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
