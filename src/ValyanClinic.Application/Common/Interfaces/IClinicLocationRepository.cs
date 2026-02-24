using ValyanClinic.Application.Features.Clinics.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe locațiile fizice ale clinicii.
/// </summary>
public interface IClinicLocationRepository
{
    Task<IEnumerable<ClinicLocationDto>> GetByClinicAsync(Guid clinicId, bool? isActive, CancellationToken ct);
    Task<ClinicLocationDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);
    Task<Guid> CreateAsync(
        Guid clinicId, string name, string address, string city, string county,
        string? postalCode, string? phoneNumber, string? email, bool isPrimary,
        CancellationToken ct);
    Task UpdateAsync(
        Guid id, Guid clinicId, string name, string address, string city, string county,
        string? postalCode, string? phoneNumber, string? email, bool isPrimary,
        CancellationToken ct);
    Task DeleteAsync(Guid id, Guid clinicId, CancellationToken ct);
}
