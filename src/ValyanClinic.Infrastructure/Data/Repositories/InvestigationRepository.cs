using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Investigations.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class InvestigationRepository(DapperContext context) : IInvestigationRepository
{
    public async Task<InvestigationDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<InvestigationDto>(
            new CommandDefinition(
                InvestigationProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<InvestigationDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<InvestigationDto>(
            new CommandDefinition(
                InvestigationProcedures.GetByConsultation,
                new { ConsultationId = consultationId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<InvestigationDto>> GetByPatientAsync(
        Guid patientId, Guid clinicId, string? investigationType,
        DateTime? dateFrom, DateTime? dateTo, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<InvestigationDto>(
            new CommandDefinition(
                InvestigationProcedures.GetByPatient,
                new
                {
                    PatientId = patientId,
                    ClinicId = clinicId,
                    InvestigationType = investigationType,
                    DateFrom = dateFrom,
                    DateTo = dateTo
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<InvestigationTrendingPointDto>> GetTrendingAsync(
        Guid patientId, Guid clinicId, string investigationType, string jsonPath,
        DateTime? dateFrom, DateTime? dateTo, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<InvestigationTrendingPointDto>(
            new CommandDefinition(
                InvestigationProcedures.GetTrending,
                new
                {
                    PatientId = patientId,
                    ClinicId = clinicId,
                    InvestigationType = investigationType,
                    JsonPath = jsonPath,
                    DateFrom = dateFrom,
                    DateTo = dateTo
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<Guid> CreateAsync(InvestigationCreateData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                InvestigationProcedures.Create,
                new
                {
                    data.ClinicId,
                    data.ConsultationId,
                    data.PatientId,
                    data.DoctorId,
                    data.InvestigationType,
                    data.InvestigationDate,
                    data.StructuredData,
                    data.Narrative,
                    data.IsExternal,
                    data.ExternalSource,
                    data.Status,
                    data.AttachedDocumentId,
                    data.HasStructuredData,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(InvestigationUpdateData data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                InvestigationProcedures.Update,
                new
                {
                    data.Id,
                    data.ClinicId,
                    data.InvestigationDate,
                    data.StructuredData,
                    data.Narrative,
                    data.IsExternal,
                    data.ExternalSource,
                    data.Status,
                    data.AttachedDocumentId,
                    data.HasStructuredData,
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
                InvestigationProcedures.Delete,
                new { Id = id, ClinicId = clinicId, DeletedBy = deletedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<InvestigationTypeDto>> GetTypesAsync(string? specialty, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var sp = string.IsNullOrWhiteSpace(specialty)
            ? InvestigationProcedures.TypeGetAll
            : InvestigationProcedures.TypeGetBySpecialty;
        var parameters = string.IsNullOrWhiteSpace(specialty)
            ? (object)new { }
            : new { Specialty = specialty };

        var rows = await connection.QueryAsync<InvestigationTypeDto>(
            new CommandDefinition(sp, parameters, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }
}
