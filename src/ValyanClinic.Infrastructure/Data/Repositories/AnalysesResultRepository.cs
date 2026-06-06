using System.Data;
using System.Text.Json;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class AnalysesResultRepository(DapperContext context) : IAnalysesResultRepository
{
    public async Task<AnalysesResultDetailDto?> GetByIdAsync(
        Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                AnalysesResultProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var header = await multi.ReadFirstOrDefaultAsync<AnalysesResultDetailDto>();
        if (header is null)
            return null;

        var details = (await multi.ReadAsync<AnalysesResultDetailRowDto>()).ToList();
        return header with { Details = details };
    }

    public async Task<IReadOnlyList<AnalysesResultListDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<AnalysesResultListDto>(
            new CommandDefinition(
                AnalysesResultProcedures.GetByConsultation,
                new { ConsultationId = consultationId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<AnalysesResultsForLetterResponse> GetForMedicalLetterAsync(
        Guid consultationId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                AnalysesResultProcedures.GetForMedicalLetter,
                new { ConsultationId = consultationId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var headers = (await multi.ReadAsync<AnalysesResultForLetterHeaderDto>()).ToList();
        var details = (await multi.ReadAsync<AnalysesResultDetailRowDto>()).ToList();

        // Grupeaza detaliile pe headere
        var detailsByResultId = details.ToLookup(d => d.ResultId);
        var bulletins = headers
            .Select(h => h with { Details = detailsByResultId[h.Id].ToList() })
            .ToList();

        return new AnalysesResultsForLetterResponse { Bulletins = bulletins };
    }

    public async Task<(IReadOnlyList<AnalysesResultListDto> Headers, IReadOnlyList<AnalysesResultDetailRowDto> Details)>
        GetByPatientAsync(
            Guid patientId, Guid clinicId,
            DateOnly? dateFrom, DateOnly? dateTo,
            CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                AnalysesResultProcedures.GetByPatient,
                new
                {
                    PatientId = patientId,
                    ClinicId  = clinicId,
                    DateFrom  = dateFrom.HasValue ? (DateTime?)dateFrom.Value.ToDateTime(TimeOnly.MinValue) : null,
                    DateTo    = dateTo.HasValue   ? (DateTime?)dateTo.Value.ToDateTime(TimeOnly.MinValue)   : null
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var headers = (await multi.ReadAsync<AnalysesResultListDto>()).ToList();
        var details = (await multi.ReadAsync<AnalysesResultDetailRowDto>()).ToList();
        return (headers, details);
    }

    public async Task<Guid> CreateAsync(
        AnalysesResultSaveData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                AnalysesResultProcedures.Create,
                new
                {
                    data.ClinicId,
                    data.PatientId,
                    data.ConsultationId,
                    data.Laboratory,
                    data.BulletinNumber,
                    CollectionDate = data.CollectionDate.ToDateTime(TimeOnly.MinValue),
                    ResultDate     = data.ResultDate.HasValue
                        ? (DateTime?)data.ResultDate.Value.ToDateTime(TimeOnly.MinValue)
                        : null,
                    data.DoctorName,
                    data.DetailsJson,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, AnalysesResultSaveData data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                AnalysesResultProcedures.Update,
                new
                {
                    Id             = id,
                    data.ClinicId,
                    data.Laboratory,
                    data.BulletinNumber,
                    CollectionDate = data.CollectionDate.ToDateTime(TimeOnly.MinValue),
                    ResultDate     = data.ResultDate.HasValue
                        ? (DateTime?)data.ResultDate.Value.ToDateTime(TimeOnly.MinValue)
                        : null,
                    data.DoctorName,
                    data.DetailsJson,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(
        Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                AnalysesResultProcedures.Delete,
                new { Id = id, ClinicId = clinicId, DeletedBy = deletedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
