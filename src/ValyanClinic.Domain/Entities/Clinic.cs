namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Entitate Domain pentru clinică (societate comercială).
/// </summary>
public sealed class Clinic
{
    public Guid Id { get; init; }
    public string Name { get; set; } = string.Empty;
    public string FiscalCode { get; set; } = string.Empty;          // CUI / CIF
    public string? TradeRegisterNumber { get; set; }                 // Nr. Registrul Comerțului
    public string? CaenCode { get; set; }                            // Cod CAEN principal
    public string? LegalRepresentative { get; set; }                 // Reprezentant legal
    public string? ContractCNAS { get; set; }                        // Nr. contract CNAS
    public string Address { get; set; } = string.Empty;              // Adresa sediului social
    public string City { get; set; } = string.Empty;                 // Oraș
    public string County { get; set; } = string.Empty;               // Județ
    public string? PostalCode { get; set; }                          // Cod poștal
    public string? BankName { get; set; }                            // Banca
    public string? BankAccount { get; set; }                         // IBAN
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
    public string? LogoPath { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; set; }
}
