using System.Data;
using System.Text.Json;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Clinics.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru codurile CAEN ale clinicii (exclusiv prin Stored Procedures).</summary>
public sealed class ClinicCaenCodeRepository(DapperContext context) : IClinicCaenCodeRepository
{
    // Opțiuni JSON — chei camelCase pentru compatibilitate cu OPENJSON din SP
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task<IReadOnlyList<ClinicCaenCodeDto>> GetByClinicIdAsync(
        Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var results = await connection.QueryAsync<ClinicCaenCodeDto>(
            new CommandDefinition(
                ClinicCaenCodeProcedures.GetByClinicId,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return results.ToList();
    }

    public async Task SyncAsync(
        Guid clinicId, IEnumerable<Guid> caenCodeIds, CancellationToken ct)
    {
        // Construiește JSON pentru SP: primul element e marcat ca principal
        var idList = caenCodeIds.ToList();
        var items = idList.Select((id, idx) => new
        {
            caenCodeId = id,
            isPrimary  = idx == 0   // primul cod CAEN = principal
        });

        var json = idList.Count > 0
            ? JsonSerializer.Serialize(items, JsonOptions)
            : "[]";

        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicCaenCodeProcedures.Sync,
                new { ClinicId = clinicId, CaenCodesJson = json },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
