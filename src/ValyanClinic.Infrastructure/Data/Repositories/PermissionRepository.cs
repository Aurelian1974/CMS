using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Implementare repository permisiuni cu Dapper — exclusiv Stored Procedures.</summary>
public sealed class PermissionRepository(DapperContext context) : IPermissionRepository
{
    public async Task<IReadOnlyList<UserModulePermissionDto>> GetEffectiveByUserAsync(
        Guid userId, Guid roleId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var result = await connection.QueryAsync<UserModulePermissionDto>(
            new CommandDefinition(
                PermissionProcedures.GetEffectiveByUser,
                new { UserId = userId, RoleId = roleId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return result.ToList().AsReadOnly();
    }

    public async Task<IReadOnlyList<RoleModulePermissionDto>> GetRolePermissionsAsync(
        Guid roleId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var result = await connection.QueryAsync<RoleModulePermissionDto>(
            new CommandDefinition(
                PermissionProcedures.GetRolePermissions,
                new { RoleId = roleId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return result.ToList().AsReadOnly();
    }

    public async Task<IReadOnlyList<UserOverrideDto>> GetUserOverridesAsync(
        Guid userId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var result = await connection.QueryAsync<UserOverrideDto>(
            new CommandDefinition(
                PermissionProcedures.GetUserOverrides,
                new { UserId = userId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return result.ToList().AsReadOnly();
    }

    public async Task<int> SyncRolePermissionsAsync(
        Guid roleId, string permissionsJson, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                PermissionProcedures.SyncRolePermissions,
                new { RoleId = roleId, Permissions = permissionsJson, UpdatedBy = updatedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<int> SyncUserOverridesAsync(
        Guid userId, string overridesJson, Guid grantedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                PermissionProcedures.SyncUserOverrides,
                new { UserId = userId, Overrides = overridesJson, GrantedBy = grantedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<ModuleDto>> GetAllModulesAsync(CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var result = await connection.QueryAsync<ModuleDto>(
            new CommandDefinition(
                PermissionProcedures.GetAllModules,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return result.ToList().AsReadOnly();
    }

    public async Task<IReadOnlyList<AccessLevelDto>> GetAllAccessLevelsAsync(CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var result = await connection.QueryAsync<AccessLevelDto>(
            new CommandDefinition(
                PermissionProcedures.GetAllAccessLevels,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return result.ToList().AsReadOnly();
    }
}
