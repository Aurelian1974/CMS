namespace ValyanClinic.Application.Features.Clinics.DTOs;

/// <summary>
/// DTO pentru datele clinicii (societate comercială).
/// Clasă (nu record) pentru că Dapper mapează din coloane flat, iar sub-colecțiile
/// se setează separat după citirea result set-urilor suplimentare (QueryMultiple).
/// </summary>
public sealed class ClinicDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string FiscalCode { get; init; } = string.Empty;
    public string? TradeRegisterNumber { get; init; }
    public string? LegalRepresentative { get; init; }
    public string? ContractCNAS { get; init; }
    public string? LogoPath { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }

    /// <summary>Coduri CAEN — setat după result set 2.</summary>
    public IReadOnlyList<ClinicCaenCodeDto> CaenCodes { get; set; } = [];

    /// <summary>Conturi bancare — setat după result set 3.</summary>
    public IReadOnlyList<ClinicBankAccountDto> BankAccounts { get; set; } = [];

    /// <summary>Adrese — setat după result set 4.</summary>
    public IReadOnlyList<ClinicAddressDto> Addresses { get; set; } = [];

    /// <summary>Date de contact — setat după result set 5.</summary>
    public IReadOnlyList<ClinicContactDto> Contacts { get; set; } = [];

    /// <summary>Persoane de contact — setat după result set 6.</summary>
    public IReadOnlyList<ClinicContactPersonDto> ContactPersons { get; set; } = [];
}
