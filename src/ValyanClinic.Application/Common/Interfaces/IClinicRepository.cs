using ValyanClinic.Application.Features.Clinics.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe clinici (societăți comerciale).
/// </summary>
public interface IClinicRepository
{
    Task<ClinicDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IEnumerable<ClinicDto>> GetAllAsync(bool? isActive, CancellationToken ct);
    Task<Guid> CreateAsync(
        string name, string fiscalCode, string? tradeRegisterNumber,
        string? legalRepresentative, string? contractCnas,
        string address, string city, string county, string? postalCode,
        string? bankName, string? bankAccount,
        string? email, string? phoneNumber, string? website,
        CancellationToken ct);
    Task UpdateAsync(
        Guid id, string name, string fiscalCode, string? tradeRegisterNumber,
        string? legalRepresentative, string? contractCnas,
        CancellationToken ct);

    // ── Conturi bancare ──────────────────────────────────────────────────────
    Task<Guid> CreateBankAccountAsync(
        Guid clinicId, string bankName, string iban, string currency,
        bool isMain, string? notes, CancellationToken ct);
    Task UpdateBankAccountAsync(
        Guid id, Guid clinicId, string bankName, string iban, string currency,
        bool isMain, string? notes, CancellationToken ct);
    Task DeleteBankAccountAsync(Guid id, Guid clinicId, CancellationToken ct);

    // ── Adrese ───────────────────────────────────────────────────────────────
    Task<Guid> CreateAddressAsync(
        Guid clinicId, string addressType, string street, string city, string county,
        string? postalCode, string country, bool isMain, CancellationToken ct);
    Task UpdateAddressAsync(
        Guid id, Guid clinicId, string addressType, string street, string city,
        string county, string? postalCode, string country, bool isMain, CancellationToken ct);
    Task DeleteAddressAsync(Guid id, Guid clinicId, CancellationToken ct);

    // ── Date de contact ──────────────────────────────────────────────────────
    Task<Guid> CreateContactAsync(
        Guid clinicId, string contactType, string value, string? label,
        bool isMain, CancellationToken ct);
    Task UpdateContactAsync(
        Guid id, Guid clinicId, string contactType, string value,
        string? label, bool isMain, CancellationToken ct);
    Task DeleteContactAsync(Guid id, Guid clinicId, CancellationToken ct);
}
