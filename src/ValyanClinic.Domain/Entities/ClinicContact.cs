namespace ValyanClinic.Domain.Entities;

public sealed class ClinicContact
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    /// <summary>Email | Telefon | Website | Fax</summary>
    public string ContactType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Label { get; set; }
    public bool IsMain { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; set; }
}
