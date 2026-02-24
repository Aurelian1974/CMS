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
        string? caenCode, string? legalRepresentative, string? contractCnas,
        string address, string city, string county, string? postalCode,
        string? bankName, string? bankAccount,
        string? email, string? phoneNumber, string? website,
        CancellationToken ct);
    Task UpdateAsync(
        Guid id, string name, string fiscalCode, string? tradeRegisterNumber,
        string? caenCode, string? legalRepresentative, string? contractCnas,
        string address, string city, string county, string? postalCode,
        string? bankName, string? bankAccount,
        string? email, string? phoneNumber, string? website,
        CancellationToken ct);
}
