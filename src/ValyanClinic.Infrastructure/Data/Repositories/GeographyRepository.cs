using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetCounties;
using ValyanClinic.Application.Features.Nomenclature.Queries.GetLocalities;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Implementare Dapper pentru date geografice: județe și localități.</summary>
public sealed class GeographyRepository(DapperContext context) : IGeographyRepository
{
    public async Task<IEnumerable<CountyDto>> GetCountiesAsync(CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<CountyDto>(
            new CommandDefinition(
                GeographyProcedures.GetCounties,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IEnumerable<LocalityDto>> GetLocalitiesByCountyAsync(Guid countyId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<LocalityDto>(
            new CommandDefinition(
                GeographyProcedures.GetLocalities,
                new { CountyId = countyId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
