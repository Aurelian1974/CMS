using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.ICD10.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Implementare Dapper pentru coduri ICD-10 (căutare + favorite).</summary>
public sealed class ICD10Repository(DapperContext context) : IICD10Repository
{
    public async Task<IEnumerable<ICD10SearchResultDto>> SearchAsync(
        string searchTerm, int maxResults, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<ICD10SearchResultDto>(
            new CommandDefinition(
                ICD10Procedures.Search,
                new { SearchTerm = searchTerm, MaxResults = maxResults },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IEnumerable<ICD10SearchResultDto>> GetFavoritesAsync(
        Guid userId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<ICD10SearchResultDto>(
            new CommandDefinition(
                ICD10Procedures.GetFavorites,
                new { PersonalID = userId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<bool> AddFavoriteAsync(
        Guid userId, Guid icd10Id, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("PersonalID", userId, DbType.Guid);
        parameters.Add("ICD10_ID", icd10Id, DbType.Guid);
        parameters.Add("FavoriteId", dbType: DbType.Guid, direction: ParameterDirection.Output);

        await connection.ExecuteAsync(
            new CommandDefinition(
                ICD10Procedures.AddFavorite,
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return true;
    }

    public async Task<bool> RemoveFavoriteAsync(
        Guid userId, Guid icd10Id, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var result = await connection.ExecuteAsync(
            new CommandDefinition(
                ICD10Procedures.RemoveFavorite,
                new { PersonalID = userId, ICD10_ID = icd10Id },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return result > 0;
    }
}
