using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Consultations.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class ConsultationRepository(DapperContext context) : IConsultationRepository
{
    public async Task<ConsultationPagedResult> GetPagedAsync(
        Guid clinicId, string? search, Guid? doctorId, Guid? statusId,
        DateTime? dateFrom, DateTime? dateTo,
        int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                ConsultationProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    Search = search,
                    DoctorId = doctorId,
                    StatusId = statusId,
                    DateFrom = dateFrom,
                    DateTo = dateTo,
                    Page = page,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    SortDir = sortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items = (await multi.ReadAsync<ConsultationListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();
        var stats = await multi.ReadSingleAsync<ConsultationStatsDto>();

        return new ConsultationPagedResult(
            new PagedResult<ConsultationListDto>(items, totalCount, page, pageSize),
            stats);
    }

    public async Task<ConsultationDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<ConsultationDetailDto>(
            new CommandDefinition(
                ConsultationProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<ConsultationDetailDto?> GetByAppointmentIdAsync(Guid appointmentId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<ConsultationDetailDto>(
            new CommandDefinition(
                ConsultationProcedures.GetByAppointmentId,
                new { AppointmentId = appointmentId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IEnumerable<ConsultationListDto>> GetByPatientAsync(
        Guid patientId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<ConsultationListDto>(
            new CommandDefinition(
                ConsultationProcedures.GetByPatient,
                new { PatientId = patientId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(
        Guid clinicId, Guid patientId, Guid doctorId,
        Guid? appointmentId, DateTime date,
        string? motiv, string? istoricMedicalPersonal, string? tratamentAnterior,
        string? istoricBoalaActuala, string? istoricFamilial, string? factoriDeRisc, string? alergiiConsultatie,
        string? stareGenerala, string? tegumente, string? mucoase,
        decimal? greutate, int? inaltime,
        int? tensiuneSistolica, int? tensiuneDiastolica, int? puls, int? frecventaRespiratorie,
        decimal? temperatura, int? spO2, string? edeme, decimal? glicemie, string? ganglioniLimfatici,
        string? examenClinic, string? alteObservatiiClinice,
        string? investigatii, string? analizeMedicale,
        string? diagnostic, string? diagnosticCodes, string? recomandari, string? observatii,
        string? concluzii,
        bool esteAfectiuneOncologica, bool areIndicatieInternare,
        bool saEliberatPrescriptie, string? seriePrescriptie,
        bool saEliberatConcediuMedical, string? serieConcediuMedical,
        bool saEliberatIngrijiriDomiciliu, bool saEliberatDispozitiveMedicale,
        DateTime? dataUrmatoareiVizite, string? noteUrmatoareaVizita,
        Guid? statusId, Guid createdBy,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ConsultationProcedures.Create,
                new
                {
                    ClinicId = clinicId,
                    PatientId = patientId,
                    DoctorId = doctorId,
                    AppointmentId = appointmentId,
                    Date = date,
                    Motiv = motiv,
                    IstoricMedicalPersonal = istoricMedicalPersonal,
                    TratamentAnterior = tratamentAnterior,
                    IstoricBoalaActuala = istoricBoalaActuala,
                    IstoricFamilial = istoricFamilial,
                    FactoriDeRisc = factoriDeRisc,
                    AlergiiConsultatie = alergiiConsultatie,
                    StareGenerala = stareGenerala,
                    Tegumente = tegumente,
                    Mucoase = mucoase,
                    Greutate = greutate,
                    Inaltime = inaltime,
                    TensiuneSistolica = tensiuneSistolica,
                    TensiuneDiastolica = tensiuneDiastolica,
                    Puls = puls,
                    FrecventaRespiratorie = frecventaRespiratorie,
                    Temperatura = temperatura,
                    SpO2 = spO2,
                    Edeme = edeme,
                    Glicemie = glicemie,
                    GanglioniLimfatici = ganglioniLimfatici,
                    ExamenClinic = examenClinic,
                    AlteObservatiiClinice = alteObservatiiClinice,
                    Investigatii = investigatii,
                    AnalizeMedicale = analizeMedicale,
                    Diagnostic = diagnostic,
                    DiagnosticCodes = diagnosticCodes,
                    Recomandari = recomandari,
                    Observatii = observatii,
                    Concluzii = concluzii,
                    EsteAfectiuneOncologica = esteAfectiuneOncologica,
                    AreIndicatieInternare = areIndicatieInternare,
                    SaEliberatPrescriptie = saEliberatPrescriptie,
                    SeriePrescriptie = seriePrescriptie,
                    SaEliberatConcediuMedical = saEliberatConcediuMedical,
                    SerieConcediuMedical = serieConcediuMedical,
                    SaEliberatIngrijiriDomiciliu = saEliberatIngrijiriDomiciliu,
                    SaEliberatDispozitiveMedicale = saEliberatDispozitiveMedicale,
                    DataUrmatoareiVizite = dataUrmatoareiVizite,
                    NoteUrmatoareaVizita = noteUrmatoareaVizita,
                    StatusId = statusId,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, Guid clinicId, Guid patientId, Guid doctorId,
        Guid? appointmentId, DateTime date,
        string? motiv, string? istoricMedicalPersonal, string? tratamentAnterior,
        string? istoricBoalaActuala, string? istoricFamilial, string? factoriDeRisc, string? alergiiConsultatie,
        string? stareGenerala, string? tegumente, string? mucoase,
        decimal? greutate, int? inaltime,
        int? tensiuneSistolica, int? tensiuneDiastolica, int? puls, int? frecventaRespiratorie,
        decimal? temperatura, int? spO2, string? edeme, decimal? glicemie, string? ganglioniLimfatici,
        string? examenClinic, string? alteObservatiiClinice,
        string? investigatii, string? analizeMedicale,
        string? diagnostic, string? diagnosticCodes, string? recomandari, string? observatii,
        string? concluzii,
        bool esteAfectiuneOncologica, bool areIndicatieInternare,
        bool saEliberatPrescriptie, string? seriePrescriptie,
        bool saEliberatConcediuMedical, string? serieConcediuMedical,
        bool saEliberatIngrijiriDomiciliu, bool saEliberatDispozitiveMedicale,
        DateTime? dataUrmatoareiVizite, string? noteUrmatoareaVizita,
        Guid? statusId, Guid updatedBy,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ConsultationProcedures.Update,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    PatientId = patientId,
                    DoctorId = doctorId,
                    AppointmentId = appointmentId,
                    Date = date,
                    Motiv = motiv,
                    IstoricMedicalPersonal = istoricMedicalPersonal,
                    TratamentAnterior = tratamentAnterior,
                    IstoricBoalaActuala = istoricBoalaActuala,
                    IstoricFamilial = istoricFamilial,
                    FactoriDeRisc = factoriDeRisc,
                    AlergiiConsultatie = alergiiConsultatie,
                    StareGenerala = stareGenerala,
                    Tegumente = tegumente,
                    Mucoase = mucoase,
                    Greutate = greutate,
                    Inaltime = inaltime,
                    TensiuneSistolica = tensiuneSistolica,
                    TensiuneDiastolica = tensiuneDiastolica,
                    Puls = puls,
                    FrecventaRespiratorie = frecventaRespiratorie,
                    Temperatura = temperatura,
                    SpO2 = spO2,
                    Edeme = edeme,
                    Glicemie = glicemie,
                    GanglioniLimfatici = ganglioniLimfatici,
                    ExamenClinic = examenClinic,
                    AlteObservatiiClinice = alteObservatiiClinice,
                    Investigatii = investigatii,
                    AnalizeMedicale = analizeMedicale,
                    Diagnostic = diagnostic,
                    DiagnosticCodes = diagnosticCodes,
                    Recomandari = recomandari,
                    Observatii = observatii,
                    Concluzii = concluzii,
                    EsteAfectiuneOncologica = esteAfectiuneOncologica,
                    AreIndicatieInternare = areIndicatieInternare,
                    SaEliberatPrescriptie = saEliberatPrescriptie,
                    SeriePrescriptie = seriePrescriptie,
                    SaEliberatConcediuMedical = saEliberatConcediuMedical,
                    SerieConcediuMedical = serieConcediuMedical,
                    SaEliberatIngrijiriDomiciliu = saEliberatIngrijiriDomiciliu,
                    SaEliberatDispozitiveMedicale = saEliberatDispozitiveMedicale,
                    DataUrmatoareiVizite = dataUrmatoareiVizite,
                    NoteUrmatoareaVizita = noteUrmatoareaVizita,
                    StatusId = statusId,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ConsultationProcedures.Delete,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    DeletedBy = deletedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
