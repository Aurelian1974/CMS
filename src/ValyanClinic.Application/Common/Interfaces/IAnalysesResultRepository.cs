using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Repository pentru buletine de analize medicale (AnalysesResults + AnalysesResultDetails).</summary>
public interface IAnalysesResultRepository
{
    Task<AnalysesResultDetailDto?> GetByIdAsync(
        Guid id, Guid clinicId, CancellationToken ct);

    Task<IReadOnlyList<AnalysesResultListDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct);

    Task<AnalysesResultsForLetterResponse> GetForMedicalLetterAsync(
        Guid consultationId, CancellationToken ct);

    Task<(IReadOnlyList<AnalysesResultListDto> Headers, IReadOnlyList<AnalysesResultDetailRowDto> Details)>
        GetByPatientAsync(
            Guid patientId, Guid clinicId,
            DateOnly? dateFrom, DateOnly? dateTo,
            CancellationToken ct);

    Task<Guid> CreateAsync(
        AnalysesResultSaveData data, Guid createdBy, CancellationToken ct);

    Task UpdateAsync(
        Guid id, AnalysesResultSaveData data, Guid updatedBy, CancellationToken ct);

    Task DeleteAsync(
        Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);
}
