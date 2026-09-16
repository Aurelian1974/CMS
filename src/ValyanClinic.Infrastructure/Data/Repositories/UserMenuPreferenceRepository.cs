using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Implementare Dapper pentru preferințele sidebar-ului (favorite).</summary>
public sealed class UserMenuPreferenceRepository(DapperContext context) : IUserMenuPreferenceRepository
{
    public async Task<string?> GetFavoriteRoutesJsonAsync(Guid userId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<string?>(
            new CommandDefinition(
                UserMenuPreferenceProcedures.GetByUser,
                new { UserId = userId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpsertFavoriteRoutesAsync(
        Guid userId, Guid clinicId, string favoriteRoutesJson, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                UserMenuPreferenceProcedures.Upsert,
                new
                {
                    UserId = userId,
                    ClinicId = clinicId,
                    FavoriteRoutes = favoriteRoutesJson,
                    UpdatedBy = updatedBy,
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
