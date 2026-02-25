using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetMedicalTitles;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru titulaturi medicale (exclusiv prin Stored Procedures).</summary>
public sealed class MedicalTitleRepository(DapperContext context) : IMedicalTitleRepository
{
    public async Task<IEnumerable<MedicalTitleDto>> GetAllAsync(bool? isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<MedicalTitleDto>(
            new CommandDefinition(
                MedicalTitleProcedures.GetAll,
                new { IsActive = isActive },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(
        string name, string code, string? description,
        int displayOrder, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                MedicalTitleProcedures.Create,
                new { Name = name, Code = code, Description = description, DisplayOrder = displayOrder },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, string name, string code, string? description,
        int displayOrder, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                MedicalTitleProcedures.Update,
                new { Id = id, Name = name, Code = code, Description = description, DisplayOrder = displayOrder },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task ToggleActiveAsync(Guid id, bool isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                MedicalTitleProcedures.ToggleActive,
                new { Id = id, IsActive = isActive },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
