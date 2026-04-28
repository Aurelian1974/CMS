using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.RecommendedAnalyses.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class RecommendedAnalysisRepository(DapperContext context) : IRecommendedAnalysisRepository
{
    public async Task<IReadOnlyList<RecommendedAnalysisDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<RecommendedAnalysisDto>(
            new CommandDefinition(
                RecommendedAnalysisProcedures.GetByConsultation,
                new { ConsultationId = consultationId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<Guid> CreateAsync(RecommendedAnalysisCreateData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                RecommendedAnalysisProcedures.Create,
                new
                {
                    data.ClinicId,
                    data.ConsultationId,
                    data.PatientId,
                    data.AnalysisId,
                    data.Priority,
                    data.Notes,
                    data.Status,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(RecommendedAnalysisUpdateData data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                RecommendedAnalysisProcedures.Update,
                new
                {
                    data.Id,
                    data.ClinicId,
                    data.Priority,
                    data.Notes,
                    data.Status,
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
                RecommendedAnalysisProcedures.Delete,
                new { Id = id, ClinicId = clinicId, DeletedBy = deletedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}

public sealed class AnalysisDictionaryRepository(DapperContext context) : IAnalysisDictionaryRepository
{
    public async Task<IReadOnlyList<AnalysisDictionaryDto>> SearchAsync(string query, int top, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<AnalysisDictionaryDto>(
            new CommandDefinition(
                AnalysisProcedures.Search,
                new { Query = query, Top = top },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }
}
