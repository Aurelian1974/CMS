namespace ValyanClinic.Application.Features.Clinics.DTOs;

/// <summary>DTO pentru datele clinicii (societate comercială).</summary>
public sealed record ClinicDto(
    Guid Id,
    string Name,
    string FiscalCode,
    string? TradeRegisterNumber,
    string? CaenCode,
    string? LegalRepresentative,
    string? ContractCNAS,
    string Address,
    string City,
    string County,
    string? PostalCode,
    string? BankName,
    string? BankAccount,
    string? Email,
    string? PhoneNumber,
    string? Website,
    string? LogoPath,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
