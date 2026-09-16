using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>
/// Repository pentru operații de autentificare — login, refresh tokens, lockout.
///
/// Refresh token-urile se stochează ca hash SHA-256: metodele primesc valoarea în
/// clar și o convertesc înainte de a atinge baza de date, astfel încât apelanții
/// din Application să nu cunoască formatul de stocare.
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
                new
                {
                    UserId = userId,
                    TokenHash = RefreshTokenHasher.Hash(token),
                    ExpiresAt = expiresAt,
                    CreatedByIp = ipAddress
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<RefreshTokenDto?> GetRefreshTokenAsync(string token, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<RefreshTokenDto>(
            new CommandDefinition(
                RefreshTokenProcedures.GetByToken,
                new { TokenHash = RefreshTokenHasher.Hash(token) },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task RevokeRefreshTokenAsync(string token, string? replacedByToken, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                RefreshTokenProcedures.Revoke,
                new
                {
                    TokenHash = RefreshTokenHasher.Hash(token),
                    ReplacedByTokenHash = replacedByToken is null
                        ? null
                        : RefreshTokenHasher.Hash(replacedByToken)
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<bool> RotateRefreshTokenAsync(
        string oldToken, string newToken, Guid userId, DateTime expiresAt,
        string? ipAddress, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    RefreshTokenProcedures.Rotate,
                    new
                    {
                        OldTokenHash = RefreshTokenHasher.Hash(oldToken),
                        NewTokenHash = RefreshTokenHasher.Hash(newToken),
                        UserId = userId,
                        ExpiresAt = expiresAt,
                        CreatedByIp = ipAddress
                    },
                    commandType: CommandType.StoredProcedure,
                    cancellationToken: ct));

            return true;
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.RefreshTokenNotActive)
        {
            // Token-ul a fost rotit sau revocat între citire și rotație — cerere concurentă.
            return false;
        }
    }

    public async Task<int> DeleteExpiredRefreshTokensAsync(int retentionDays, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                RefreshTokenProcedures.DeleteExpired,
                new { RetentionDays = retentionDays },
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
