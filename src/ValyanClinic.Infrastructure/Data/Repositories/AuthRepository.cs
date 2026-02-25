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
        // Refolosim User_GetByEmail cu email = null nu merge, dar putem folosi User_GetById
        // care returnează datele necesare. Alternativ, facem un query prin GetByEmail
        // cu email-ul userului. Mai simplu: folosim GetById SP dar el cere ClinicId.
        // Soluție: query direct cu userId — SP-ul User_GetByEmail presupune email.
        // Cea mai simplă abordare: găsim userul prin Id folosind un query pe User_GetById,
        // dar acel DTO e diferit. Facem un SP nou? Nu — refolosim User_GetByEmail
        // prin email-ul userului, dar nu-l avem. O abordare practică: citim direct.
        return await connection.QueryFirstOrDefaultAsync<UserAuthDto>(
            new CommandDefinition(
                "SELECT u.Id, u.ClinicId, u.RoleId, r.Name AS RoleName, r.Code AS RoleCode, " +
                "u.DoctorId, u.MedicalStaffId, u.Username, u.Email, u.PasswordHash, " +
                "u.FirstName, u.LastName, u.IsActive, u.LastLoginAt, " +
                "u.FailedLoginAttempts, u.LockoutEnd " +
                "FROM Users u INNER JOIN Roles r ON r.Id = u.RoleId " +
                "WHERE u.Id = @UserId AND u.IsDeleted = 0",
                new { UserId = userId },
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
