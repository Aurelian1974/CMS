namespace ValyanClinic.Application.Features.Clinics.DTOs;

/// <summary>
/// DTO pentru datele clinicii (societate comercială).
/// Clasă (nu record) pentru că Dapper mapează din coloane flat, iar sub-colecțiile
/// se setează separat după citirea result set-urilor suplimentare (QueryMultiple).
/// </summary>
public sealed class ClinicDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FiscalCode { get; set; } = string.Empty;
    public string? TradeRegisterNumber { get; set; }
    public string? LegalRepresentative { get; set; }
    public string? ContractCNAS { get; set; }
    public string? LogoPath { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

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
