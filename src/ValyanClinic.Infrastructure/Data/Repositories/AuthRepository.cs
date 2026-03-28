using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>
/// Repository pentru operații de autentificare — login, refresh tokens, lockout.
/// </summary>
public sealed class AuthRepository(DapperContext context) : IAuthRepository
{
    public async Task<UserAuthDto?> GetByEmailOrUsernameAsync(string emailOrUsername, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<UserAuthDto>(
            new CommandDefinition(
                UserProcedures.GetByEmail,
                new { Email = emailOrUsername },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<UserAuthDto?> GetUserByIdForTokenAsync(Guid userId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<UserAuthDto>(
            new CommandDefinition(
                UserProcedures.GetByIdForAuth,
                new { Id = userId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task IncrementFailedLoginAsync(
        Guid userId, int maxAttempts, int lockoutMinutes, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                UserProcedures.IncrementFailedLogin,
                new { Id = userId, MaxAttempts = maxAttempts, LockoutMinutes = lockoutMinutes },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task ResetFailedLoginAsync(Guid userId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                UserProcedures.ResetFailedLogin,
                new { Id = userId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task CreateRefreshTokenAsync(
        Guid userId, string token, DateTime expiresAt, string? ipAddress, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                RefreshTokenProcedures.Create,
                new { UserId = userId, Token = token, ExpiresAt = expiresAt, CreatedByIp = ipAddress },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<RefreshTokenDto?> GetRefreshTokenAsync(string token, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<RefreshTokenDto>(
            new CommandDefinition(
                RefreshTokenProcedures.GetByToken,
                new { Token = token },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task RevokeRefreshTokenAsync(string token, string? replacedByToken, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                RefreshTokenProcedures.Revoke,
                new { Token = token, ReplacedByToken = replacedByToken },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task RevokeAllRefreshTokensAsync(Guid userId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                RefreshTokenProcedures.RevokeAll,
                new { UserId = userId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
