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
        return await ReadDetailAsync(connection,
            ConsultationProcedures.GetById,
            new { Id = id, ClinicId = clinicId },
            ct);
    }

    public async Task<ConsultationDetailDto?> GetByAppointmentIdAsync(Guid appointmentId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await ReadDetailAsync(connection,
            ConsultationProcedures.GetByAppointmentId,
            new { AppointmentId = appointmentId, ClinicId = clinicId },
            ct);
    }

    private static async Task<ConsultationDetailDto?> ReadDetailAsync(
        IDbConnection connection, string sp, object parameters, CancellationToken ct)
    {
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(sp, parameters, commandType: CommandType.StoredProcedure, cancellationToken: ct));

        var header = await multi.ReadFirstOrDefaultAsync<ConsultationHeaderRow>();
        if (header is null) return null;

        var anamnesis = await multi.ReadFirstOrDefaultAsync<ConsultationAnamnesisDto>();
        var exam = await multi.ReadFirstOrDefaultAsync<ConsultationExamDto>();

        return new ConsultationDetailDto
        {
            Id = header.Id,
            ClinicId = header.ClinicId,
            PatientId = header.PatientId,
            PatientName = header.PatientName,
            PatientPhone = header.PatientPhone,
            PatientCnp = header.PatientCnp,
            PatientEmail = header.PatientEmail,
            PatientBirthDate = header.PatientBirthDate,
            PatientGender = header.PatientGender,
            DoctorId = header.DoctorId,
            DoctorName = header.DoctorName,
            SpecialtyName = header.SpecialtyName,
            DoctorMedicalCode = header.DoctorMedicalCode,
            AppointmentId = header.AppointmentId,
            Date = header.Date,
            Anamnesis = anamnesis,
            Exam = exam,
            Investigatii = header.Investigatii,
            AnalizeMedicale = header.AnalizeMedicale,
            Diagnostic = header.Diagnostic,
            DiagnosticCodes = header.DiagnosticCodes,
            Recomandari = header.Recomandari,
            Observatii = header.Observatii,
            Concluzii = header.Concluzii,
            EsteAfectiuneOncologica = header.EsteAfectiuneOncologica,
            AreIndicatieInternare = header.AreIndicatieInternare,
            SaEliberatPrescriptie = header.SaEliberatPrescriptie,
            SeriePrescriptie = header.SeriePrescriptie,
            SaEliberatConcediuMedical = header.SaEliberatConcediuMedical,
            SerieConcediuMedical = header.SerieConcediuMedical,
            SaEliberatIngrijiriDomiciliu = header.SaEliberatIngrijiriDomiciliu,
            SaEliberatDispozitiveMedicale = header.SaEliberatDispozitiveMedicale,
            DataUrmatoareiVizite = header.DataUrmatoareiVizite,
            NoteUrmatoareaVizita = header.NoteUrmatoareaVizita,
            StatusId = header.StatusId,
            StatusName = header.StatusName,
            StatusCode = header.StatusCode,
            IsDeleted = header.IsDeleted,
            CreatedAt = header.CreatedAt,
            CreatedByName = header.CreatedByName,
            UpdatedAt = header.UpdatedAt,
            UpdatedBy = header.UpdatedBy,
            UpdatedByName = header.UpdatedByName,
        };
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

    public async Task<Guid> CreateAsync(ConsultationCreateData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ConsultationProcedures.Create,
                new
                {
                    data.ClinicId,
                    data.PatientId,
                    data.DoctorId,
                    data.AppointmentId,
                    data.Date,
                    data.Investigatii,
                    data.AnalizeMedicale,
                    data.Diagnostic,
                    data.DiagnosticCodes,
                    data.Recomandari,
                    data.Observatii,
                    data.Concluzii,
                    data.EsteAfectiuneOncologica,
                    data.AreIndicatieInternare,
                    data.SaEliberatPrescriptie,
                    data.SeriePrescriptie,
                    data.SaEliberatConcediuMedical,
                    data.SerieConcediuMedical,
                    data.SaEliberatIngrijiriDomiciliu,
                    data.SaEliberatDispozitiveMedicale,
                    data.DataUrmatoareiVizite,
                    data.NoteUrmatoareaVizita,
                    data.StatusId,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(ConsultationUpdateData data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ConsultationProcedures.Update,
                new
                {
                    data.Id,
                    data.ClinicId,
                    data.PatientId,
                    data.DoctorId,
                    data.AppointmentId,
                    data.Date,
                    data.Investigatii,
                    data.AnalizeMedicale,
                    data.Diagnostic,
                    data.DiagnosticCodes,
                    data.Recomandari,
                    data.Observatii,
                    data.Concluzii,
                    data.EsteAfectiuneOncologica,
                    data.AreIndicatieInternare,
                    data.SaEliberatPrescriptie,
                    data.SeriePrescriptie,
                    data.SaEliberatConcediuMedical,
                    data.SerieConcediuMedical,
                    data.SaEliberatIngrijiriDomiciliu,
                    data.SaEliberatDispozitiveMedicale,
                    data.DataUrmatoareiVizite,
                    data.NoteUrmatoareaVizita,
                    data.StatusId,
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

    public async Task UpsertAnamnesisAsync(Guid consultationId, Guid clinicId, ConsultationAnamnesisDto data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ConsultationProcedures.UpsertAnamnesis,
                new
                {
                    ConsultationId = consultationId,
                    ClinicId = clinicId,
                    data.Motiv,
                    data.IstoricMedicalPersonal,
                    data.TratamentAnterior,
                    data.IstoricBoalaActuala,
                    data.IstoricFamilial,
                    data.FactoriDeRisc,
                    data.AlergiiConsultatie,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpsertExamAsync(Guid consultationId, Guid clinicId, ConsultationExamDto data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ConsultationProcedures.UpsertExam,
                new
                {
                    ConsultationId = consultationId,
                    ClinicId = clinicId,
                    data.StareGenerala,
                    data.Tegumente,
                    data.Mucoase,
                    data.Greutate,
                    data.Inaltime,
                    data.TensiuneSistolica,
                    data.TensiuneDiastolica,
                    data.Puls,
                    data.FrecventaRespiratorie,
                    data.Temperatura,
                    data.SpO2,
                    data.Edeme,
                    data.Glicemie,
                    data.GanglioniLimfatici,
                    data.ExamenClinic,
                    data.AlteObservatiiClinice,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    /// <summary>Reprezintă header-ul citit din SP (proiecție Dapper internă).</summary>
    private sealed class ConsultationHeaderRow
    {
        public Guid Id { get; init; }
        public Guid ClinicId { get; init; }
        public Guid PatientId { get; init; }
        public string PatientName { get; init; } = string.Empty;
        public string? PatientPhone { get; init; }
        public string? PatientCnp { get; init; }
        public string? PatientEmail { get; init; }
        public DateTime? PatientBirthDate { get; init; }
        public string? PatientGender { get; init; }
        public Guid DoctorId { get; init; }
        public string DoctorName { get; init; } = string.Empty;
        public string? SpecialtyName { get; init; }
        public string? DoctorMedicalCode { get; init; }
        public Guid? AppointmentId { get; init; }
        public DateTime Date { get; init; }
        public string? Investigatii { get; init; }
        public string? AnalizeMedicale { get; init; }
        public string? Diagnostic { get; init; }
        public string? DiagnosticCodes { get; init; }
        public string? Recomandari { get; init; }
        public string? Observatii { get; init; }
        public string? Concluzii { get; init; }
        public bool EsteAfectiuneOncologica { get; init; }
        public bool AreIndicatieInternare { get; init; }
        public bool SaEliberatPrescriptie { get; init; }
        public string? SeriePrescriptie { get; init; }
        public bool SaEliberatConcediuMedical { get; init; }
        public string? SerieConcediuMedical { get; init; }
        public bool SaEliberatIngrijiriDomiciliu { get; init; }
        public bool SaEliberatDispozitiveMedicale { get; init; }
        public DateTime? DataUrmatoareiVizite { get; init; }
        public string? NoteUrmatoareaVizita { get; init; }
        public Guid StatusId { get; init; }
        public string StatusName { get; init; } = string.Empty;
        public string StatusCode { get; init; } = string.Empty;
        public bool IsDeleted { get; init; }
        public DateTime CreatedAt { get; init; }
        public string? CreatedByName { get; init; }
        public DateTime? UpdatedAt { get; init; }
        public Guid? UpdatedBy { get; init; }
        public string? UpdatedByName { get; init; }
    }
}
