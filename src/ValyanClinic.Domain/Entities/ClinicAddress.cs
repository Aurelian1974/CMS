namespace ValyanClinic.Domain.Entities;

public sealed class ClinicAddress
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    /// <summary>Sediu Social | Corespondenta | Punct de Lucru | Depozit | Alta</summary>
    public string AddressType { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public string Country { get; set; } = "România";
    public bool IsMain { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; set; }
}
