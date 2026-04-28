using ValyanClinic.Application.Features.Investigations.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IInvestigationRepository
{
    Task<InvestigationDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);
    Task<IReadOnlyList<InvestigationDto>> GetByConsultationAsync(Guid consultationId, Guid clinicId, CancellationToken ct);
    Task<IReadOnlyList<InvestigationDto>> GetByPatientAsync(
        Guid patientId, Guid clinicId, string? investigationType, DateTime? dateFrom, DateTime? dateTo, CancellationToken ct);
    Task<IReadOnlyList<InvestigationTrendingPointDto>> GetTrendingAsync(
        Guid patientId, Guid clinicId, string investigationType, string jsonPath,
        DateTime? dateFrom, DateTime? dateTo, CancellationToken ct);

    Task<Guid> CreateAsync(InvestigationCreateData data, Guid createdBy, CancellationToken ct);
    Task UpdateAsync(InvestigationUpdateData data, Guid updatedBy, CancellationToken ct);
    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);

    Task<IReadOnlyList<InvestigationTypeDto>> GetTypesAsync(string? specialty, CancellationToken ct);
}

public sealed record InvestigationCreateData(
    Guid ClinicId,
    Guid ConsultationId,
    Guid PatientId,
    Guid DoctorId,
    string InvestigationType,
    DateTime InvestigationDate,
    string? StructuredData,
    string? Narrative,
    bool IsExternal,
    string? ExternalSource,
    byte Status,
    Guid? AttachedDocumentId,
    bool HasStructuredData);

public sealed record InvestigationUpdateData(
    Guid Id,
    Guid ClinicId,
    DateTime InvestigationDate,
    string? StructuredData,
    string? Narrative,
    bool IsExternal,
    string? ExternalSource,
    byte Status,
    Guid? AttachedDocumentId,
    bool HasStructuredData);
