using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Nomenclatorul de tarife: servicii medicale, versiuni de preț, regimuri TVA.</summary>
public interface ITariffRepository
{
    Task<MedicalServicePagedResult> GetPagedAsync(Guid clinicId, MedicalServiceFilterData filter, CancellationToken ct);

    Task<MedicalServiceDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<Guid> CreateAsync(MedicalServiceCreateData data, Guid createdBy, CancellationToken ct);

    Task UpdateAsync(MedicalServiceUpdateData data, Guid updatedBy, CancellationToken ct);

    Task SetActiveAsync(Guid id, Guid clinicId, bool isActive, Guid updatedBy, CancellationToken ct);

    /// <summary>Adaugă o versiune de preț; versiunea anterioară se închide automat.</summary>
    Task<Guid> AddPriceAsync(
        Guid clinicId, Guid medicalServiceId, decimal price, Guid vatRateId, DateOnly validFrom,
        Guid createdBy, CancellationToken ct);

    Task<BillingLookupsDto> GetLookupsAsync(Guid clinicId, CancellationToken ct);

    Task<IReadOnlyList<VatRateDto>> GetVatRatesAsync(Guid clinicId, CancellationToken ct);

    Task<Guid> CreateVatRateAsync(Guid clinicId, string code, VatRateData data, Guid createdBy, CancellationToken ct);

    Task UpdateVatRateAsync(Guid id, Guid clinicId, VatRateData data, bool isActive, Guid updatedBy, CancellationToken ct);
}
