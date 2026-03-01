using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetCaenCodes;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru nomenclatorul codurilor CAEN (exclusiv prin Stored Procedures).</summary>
public sealed class CaenCodeRepository(DapperContext context) : ICaenCodeRepository
{
    public async Task<IEnumerable<CaenCodeDto>> SearchAsync(
        string? search, int? level, int topN, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<CaenCodeDto>(
            new CommandDefinition(
                CaenCodeProcedures.Search,
                new { Search = search, Level = level, TopN = topN },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
