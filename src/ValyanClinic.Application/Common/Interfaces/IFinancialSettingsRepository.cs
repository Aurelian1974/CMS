using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Setări financiare: casa de marcat (mapări, bridge), statut TVA, serii de facturi.</summary>
public interface IFinancialSettingsRepository
{
    Task<FiscalSettingsDto> GetFiscalSettingsAsync(Guid clinicId, CancellationToken ct);

    Task UpdateFiscalSettingsAsync(FiscalSettingsUpdateData data, Guid updatedBy, CancellationToken ct);

    Task<IReadOnlyList<InvoiceSeriesDto>> GetInvoiceSeriesAsync(Guid clinicId, CancellationToken ct);

    Task<Guid> CreateInvoiceSeriesAsync(
        Guid clinicId, string series, int startNumber, bool isDefault, Guid createdBy, CancellationToken ct);

    Task UpdateInvoiceSeriesAsync(
        Guid id, Guid clinicId, bool isDefault, bool isActive, Guid updatedBy, CancellationToken ct);
}
