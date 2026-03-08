namespace ValyanClinic.Application.Features.Clinics.DTOs;

public sealed class ClinicAddressDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string AddressType { get; init; } = string.Empty;
    public string Street { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string County { get; init; } = string.Empty;
    public string? PostalCode { get; init; }
    public string Country { get; init; } = "România";
    public bool IsMain { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
