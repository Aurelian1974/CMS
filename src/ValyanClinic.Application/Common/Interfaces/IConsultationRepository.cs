using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IConsultationRepository
{
    Task<ConsultationPagedResult> GetPagedAsync(
        Guid clinicId,
        string? search,
        Guid? doctorId,
        Guid? statusId,
        DateTime? dateFrom,
        DateTime? dateTo,
        int page,
        int pageSize,
        string sortBy,
        string sortDir,
        CancellationToken ct);

    Task<ConsultationDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<ConsultationDetailDto?> GetByAppointmentIdAsync(Guid appointmentId, Guid clinicId, CancellationToken ct);

    Task<IEnumerable<ConsultationListDto>> GetByPatientAsync(
        Guid patientId, Guid clinicId, CancellationToken ct);

    Task<Guid> CreateAsync(ConsultationCreateData data, Guid createdBy, CancellationToken ct);

    Task UpdateAsync(ConsultationUpdateData data, Guid updatedBy, CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);

    Task UpsertAnamnesisAsync(Guid consultationId, Guid clinicId, ConsultationAnamnesisDto data, Guid updatedBy, CancellationToken ct);

    Task UpsertExamAsync(Guid consultationId, Guid clinicId, ConsultationExamDto data, Guid updatedBy, CancellationToken ct);
}

public sealed record ConsultationPagedResult(
    PagedResult<ConsultationListDto> Paged,
    ConsultationStatsDto Stats);

/// <summary>Date pentru crearea unei consultații (header + tab-urile încă pe coloane vechi).</summary>
public sealed record ConsultationCreateData(
    Guid ClinicId,
    Guid PatientId,
    Guid DoctorId,
    Guid? AppointmentId,
    DateTime Date,
    string? Investigatii,
    string? AnalizeMedicale,
    string? Diagnostic,
    string? DiagnosticCodes,
    string? Recomandari,
    string? Observatii,
    string? Concluzii,
    bool EsteAfectiuneOncologica,
    bool AreIndicatieInternare,
    bool SaEliberatPrescriptie,
    string? SeriePrescriptie,
    bool SaEliberatConcediuMedical,
    string? SerieConcediuMedical,
    bool SaEliberatIngrijiriDomiciliu,
    bool SaEliberatDispozitiveMedicale,
    DateTime? DataUrmatoareiVizite,
    string? NoteUrmatoareaVizita,
    Guid? StatusId);

/// <summary>Date pentru actualizarea header-ului unei consultații (tab-urile încă pe coloane vechi).</summary>
public sealed record ConsultationUpdateData(
    Guid Id,
    Guid ClinicId,
    Guid PatientId,
    Guid DoctorId,
    Guid? AppointmentId,
    DateTime Date,
    string? Investigatii,
    string? AnalizeMedicale,
    string? Diagnostic,
    string? DiagnosticCodes,
    string? Recomandari,
    string? Observatii,
    string? Concluzii,
    bool EsteAfectiuneOncologica,
    bool AreIndicatieInternare,
    bool SaEliberatPrescriptie,
    string? SeriePrescriptie,
    bool SaEliberatConcediuMedical,
    string? SerieConcediuMedical,
    bool SaEliberatIngrijiriDomiciliu,
    bool SaEliberatDispozitiveMedicale,
    DateTime? DataUrmatoareiVizite,
    string? NoteUrmatoareaVizita,
    Guid? StatusId);
