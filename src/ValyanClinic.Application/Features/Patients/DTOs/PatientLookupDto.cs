namespace ValyanClinic.Application.Features.Patients.DTOs;

/// <summary>DTO simplificat pacient — dropdown-uri și selecție.</summary>
public sealed record PatientLookupDto(
    Guid Id,
    string FullName,
    string? Cnp,
    string? PhoneNumber);
