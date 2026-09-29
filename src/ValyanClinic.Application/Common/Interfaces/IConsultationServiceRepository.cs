using ValyanClinic.Application.Features.ConsultationServices.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Liniile de servicii ale unei consultații (snapshot de preț la adăugare).</summary>
public interface IConsultationServiceRepository
{
    Task<IReadOnlyList<ConsultationServiceDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct);

    Task<Guid> AddAsync(
        Guid clinicId, Guid consultationId, Guid medicalServiceId, decimal quantity, Guid createdBy, CancellationToken ct);

    Task UpdateQuantityAsync(Guid id, Guid clinicId, decimal quantity, Guid updatedBy, CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);

    Task<IReadOnlyList<UnbilledInvestigationDto>> GetUnbilledInvestigationsAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct);

    /// <summary>Generează liniile lipsă din investigații și le elimină pe cele rămase fără investigație; întoarce câte s-au adăugat.</summary>
    Task<int> SyncFromInvestigationsAsync(Guid consultationId, Guid clinicId, Guid userId, CancellationToken ct);
}
