using ValyanClinic.Application.Features.ConsultationMedications.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IConsultationMedicationRepository
{
    Task<IReadOnlyList<ConsultationMedicationDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct);

    Task<IReadOnlyList<CnasDrugLookupDto>> SearchDrugsAsync(
        Guid clinicId, string search, int top, CancellationToken ct);

    Task<Guid> CreateAsync(ConsultationMedicationCreateData data, Guid createdBy, CancellationToken ct);
    Task UpdateAsync(ConsultationMedicationUpdateData data, Guid updatedBy, CancellationToken ct);
    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);
}
