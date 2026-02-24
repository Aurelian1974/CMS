using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialties;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetSpecialtyTree;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru specializări medicale (exclusiv prin Stored Procedures).</summary>
public sealed class SpecialtyRepository(DapperContext context) : ISpecialtyRepository
{
    public async Task<IEnumerable<SpecialtyDto>> GetAllAsync(bool? isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<SpecialtyDto>(
            new CommandDefinition(
                SpecialtyProcedures.GetAll,
                new { IsActive = isActive },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<SpecialtyDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<SpecialtyDto>(
            new CommandDefinition(
                SpecialtyProcedures.GetById,
                new { Id = id },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<SpecialtyTreeResult> GetTreeAsync(bool? isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                SpecialtyProcedures.GetTree,
                new { IsActive = isActive },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var categories = (await multi.ReadAsync<SpecialtyTreeNodeDto>()).ToList();
        var specialties = (await multi.ReadAsync<SpecialtyTreeNodeDto>()).ToList();
        var subspecialties = (await multi.ReadAsync<SpecialtyTreeNodeDto>()).ToList();

        return new SpecialtyTreeResult
        {
            Categories = categories,
            Specialties = specialties,
            Subspecialties = subspecialties
        };
    }

    public async Task<Guid> CreateAsync(
        Guid? parentId, string name, string code, string? description,
        int displayOrder, byte level, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                SpecialtyProcedures.Create,
                new { ParentId = parentId, Name = name, Code = code, Description = description, DisplayOrder = displayOrder, Level = level },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, Guid? parentId, string name, string code, string? description,
        int displayOrder, byte level, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                SpecialtyProcedures.Update,
                new { Id = id, ParentId = parentId, Name = name, Code = code, Description = description, DisplayOrder = displayOrder, Level = level },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task ToggleActiveAsync(Guid id, bool isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                SpecialtyProcedures.ToggleActive,
                new { Id = id, IsActive = isActive },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
