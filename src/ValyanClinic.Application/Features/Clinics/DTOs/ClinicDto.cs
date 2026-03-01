namespace ValyanClinic.Application.Features.Clinics.DTOs;

/// <summary>
/// DTO pentru datele clinicii (societate comercială).
/// Clasă (nu record) pentru că Dapper mapează din coloane flat, iar CaenCodes
/// se setează separat după citirea celui de-al doilea result set (QueryMultiple).
/// </summary>
public sealed class ClinicDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string FiscalCode { get; init; } = string.Empty;
    public string? TradeRegisterNumber { get; init; }
    public string? LegalRepresentative { get; init; }
    public string? ContractCNAS { get; init; }
    public string Address { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string County { get; init; } = string.Empty;
    public string? PostalCode { get; init; }
    public string? BankName { get; init; }
    public string? BankAccount { get; init; }
    public string? Email { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Website { get; init; }
    public string? LogoPath { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }

    /// <summary>
    /// Coduri CAEN asociate clinicii — setat după a doua interogare (QueryMultiple).
    /// Codul principal (IsPrimary = true) apare primul.
    /// </summary>
    public IReadOnlyList<ClinicCaenCodeDto> CaenCodes { get; set; } = [];
}
