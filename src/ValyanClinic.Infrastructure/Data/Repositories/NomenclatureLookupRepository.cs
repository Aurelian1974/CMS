using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetNomenclatureLookup;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Implementare Dapper pentru nomenclatoare simple (lookup tables).</summary>
public sealed class NomenclatureLookupRepository(DapperContext context) : INomenclatureLookupRepository
{
    public async Task<IEnumerable<NomenclatureLookupDto>> GetGendersAsync(bool? isActive, CancellationToken ct)
        => await QueryLookupAsync(NomenclatureLookupProcedures.GetGenders, isActive, ct);

    public async Task<IEnumerable<NomenclatureLookupDto>> GetBloodTypesAsync(bool? isActive, CancellationToken ct)
        => await QueryLookupAsync(NomenclatureLookupProcedures.GetBloodTypes, isActive, ct);

    public async Task<IEnumerable<NomenclatureLookupDto>> GetAllergyTypesAsync(bool? isActive, CancellationToken ct)
        => await QueryLookupAsync(NomenclatureLookupProcedures.GetAllergyTypes, isActive, ct);

    public async Task<IEnumerable<NomenclatureLookupDto>> GetAllergySeveritiesAsync(bool? isActive, CancellationToken ct)
        => await QueryLookupAsync(NomenclatureLookupProcedures.GetAllergySeverities, isActive, ct);

    /// <summary>Executa un SP de nomenclator cu parametrul standard @IsActive.</summary>
    private async Task<IEnumerable<NomenclatureLookupDto>> QueryLookupAsync(
        string spName, bool? isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<NomenclatureLookupDto>(
            new CommandDefinition(
                spName,
                new { IsActive = isActive },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
