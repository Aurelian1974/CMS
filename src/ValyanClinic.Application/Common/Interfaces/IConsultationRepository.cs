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

    Task<Guid> CreateAsync(
        Guid clinicId,
        Guid patientId,
        Guid doctorId,
        Guid? appointmentId,
        DateTime date,
        string? motiv,
        string? istoricMedicalPersonal,
        string? tratamentAnterior,
        string? istoricBoalaActuala,
        string? istoricFamilial,
        string? factoriDeRisc,
        string? alergiiConsultatie,
        string? stareGenerala,
        string? tegumente,
        string? mucoase,
        decimal? greutate,
        int? inaltime,
        int? tensiuneSistolica,
        int? tensiuneDiastolica,
        int? puls,
        int? frecventaRespiratorie,
        decimal? temperatura,
        int? spO2,
        string? edeme,
        decimal? glicemie,
        string? ganglioniLimfatici,
        string? examenClinic,
        string? alteObservatiiClinice,
        string? investigatii,
        string? analizeMedicale,
        string? diagnostic,
        string? diagnosticCodes,
        string? recomandari,
        string? observatii,
        string? concluzii,
        bool esteAfectiuneOncologica,
        bool areIndicatieInternare,
        bool saEliberatPrescriptie,
        string? seriePrescriptie,
        bool saEliberatConcediuMedical,
        string? serieConcediuMedical,
        bool saEliberatIngrijiriDomiciliu,
        bool saEliberatDispozitiveMedicale,
        DateTime? dataUrmatoareiVizite,
        string? noteUrmatoareaVizita,
        Guid? statusId,
        Guid createdBy,
        CancellationToken ct);

    Task UpdateAsync(
        Guid id,
        Guid clinicId,
        Guid patientId,
        Guid doctorId,
        Guid? appointmentId,
        DateTime date,
        string? motiv,
        string? istoricMedicalPersonal,
        string? tratamentAnterior,
        string? istoricBoalaActuala,
        string? istoricFamilial,
        string? factoriDeRisc,
        string? alergiiConsultatie,
        string? stareGenerala,
        string? tegumente,
        string? mucoase,
        decimal? greutate,
        int? inaltime,
        int? tensiuneSistolica,
        int? tensiuneDiastolica,
        int? puls,
        int? frecventaRespiratorie,
        decimal? temperatura,
        int? spO2,
        string? edeme,
        decimal? glicemie,
        string? ganglioniLimfatici,
        string? examenClinic,
        string? alteObservatiiClinice,
        string? investigatii,
        string? analizeMedicale,
        string? diagnostic,
        string? diagnosticCodes,
        string? recomandari,
        string? observatii,
        string? concluzii,
        bool esteAfectiuneOncologica,
        bool areIndicatieInternare,
        bool saEliberatPrescriptie,
        string? seriePrescriptie,
        bool saEliberatConcediuMedical,
        string? serieConcediuMedical,
        bool saEliberatIngrijiriDomiciliu,
        bool saEliberatDispozitiveMedicale,
        DateTime? dataUrmatoareiVizite,
        string? noteUrmatoareaVizita,
        Guid? statusId,
        Guid updatedBy,
        CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);
}

public sealed record ConsultationPagedResult(
    PagedResult<ConsultationListDto> Paged,
    ConsultationStatsDto Stats);
