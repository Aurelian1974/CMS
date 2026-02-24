namespace ValyanClinic.Application.Features.Clinics.DTOs;

/// <summary>DTO pentru locația fizică a clinicii.</summary>
public sealed record ClinicLocationDto(
    Guid Id,
    Guid ClinicId,
    string Name,
    string Address,
    string City,
    string County,
    string? PostalCode,
    string? PhoneNumber,
    string? Email,
    bool IsPrimary,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
