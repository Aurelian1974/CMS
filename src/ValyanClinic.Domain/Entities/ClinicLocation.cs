namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Entitate Domain pentru locație fizică / punct de lucru al clinicii.
/// </summary>
public sealed class ClinicLocation
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; set; }
}
