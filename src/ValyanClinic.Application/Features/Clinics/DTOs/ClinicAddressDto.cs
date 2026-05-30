namespace ValyanClinic.Application.Features.Clinics.DTOs;

public sealed class ClinicAddressDto
{
    public Guid Id { get; set; }
    public Guid ClinicId { get; set; }
    public string AddressType { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public string Country { get; set; } = "România";
    public bool IsMain { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
