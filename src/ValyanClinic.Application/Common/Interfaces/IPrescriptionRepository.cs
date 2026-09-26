using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IPrescriptionRepository
{
    Task<PrescriptionPagedResult> GetPagedAsync(Guid clinicId, PrescriptionFilterData filter, CancellationToken ct);

    Task<PrescriptionDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<IReadOnlyList<PrescriptionListDto>> GetByConsultationAsync(Guid consultationId, Guid clinicId, CancellationToken ct);

    Task<PrescriptionLookupsDto> GetLookupsAsync(Guid clinicId, CancellationToken ct);

    /// <summary>Creează rețetele (separate pe compensat / simplu / program național); returnează Id-urile.</summary>
    Task<IReadOnlyList<Guid>> CreateAsync(PrescriptionCreateData data, Guid createdBy, CancellationToken ct);

    Task<IReadOnlyList<Guid>> GenerateFromConsultationAsync(
        Guid consultationId, Guid clinicId, Guid? careTypeId, Guid? insuredCategoryId, int? treatmentDays,
        Guid createdBy, CancellationToken ct);

    Task UpdateAsync(PrescriptionUpdateData data, Guid updatedBy, CancellationToken ct);

    Task IssueAsync(Guid id, Guid clinicId, Guid issuedBy, CancellationToken ct);

    Task CancelAsync(Guid id, Guid clinicId, string reason, Guid cancelledBy, CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);

    /// <summary>Rezultatul transmiterii în SIPE: succes (ElectronicId) sau eroare (mesaj).</summary>
    Task SetTransmissionAsync(
        Guid id, Guid clinicId, string? electronicId, bool isOffline, string? errorMessage,
        Guid updatedBy, CancellationToken ct);
}
