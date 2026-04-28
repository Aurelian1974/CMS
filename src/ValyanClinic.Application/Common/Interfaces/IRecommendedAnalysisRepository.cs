using ValyanClinic.Application.Features.RecommendedAnalyses.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IRecommendedAnalysisRepository
{
    Task<IReadOnlyList<RecommendedAnalysisDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct);

    Task<Guid> CreateAsync(RecommendedAnalysisCreateData data, Guid createdBy, CancellationToken ct);
    Task UpdateAsync(RecommendedAnalysisUpdateData data, Guid updatedBy, CancellationToken ct);
    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);
}

public sealed record RecommendedAnalysisCreateData(
    Guid ClinicId,
    Guid ConsultationId,
    Guid PatientId,
    Guid AnalysisId,
    byte Priority,
    string? Notes,
    byte Status);

public sealed record RecommendedAnalysisUpdateData(
    Guid Id,
    Guid ClinicId,
    byte Priority,
    string? Notes,
    byte Status);

public interface IAnalysisDictionaryRepository
{
    Task<IReadOnlyList<AnalysisDictionaryDto>> SearchAsync(string query, int top, CancellationToken ct);
}
