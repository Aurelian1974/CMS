namespace ValyanClinic.Domain.Entities;

public sealed class ClinicContactPerson
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string Name { get; set; } = string.Empty;
    public string? Function { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public bool IsMain { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; set; }
}
