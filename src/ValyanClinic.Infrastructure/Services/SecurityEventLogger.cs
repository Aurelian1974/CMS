using System.Data;
using Dapper;
using Microsoft.Extensions.Logging;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Data;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Scrie evenimentele de securitate prin SecurityEvent_Create, completand
/// automat IP-ul si user agent-ul cererii curente.
/// </summary>
public sealed class SecurityEventLogger(
    DapperContext context,
    IRequestContext requestContext,
    ILogger<SecurityEventLogger> logger) : ISecurityEventLogger
{
    /// <summary>Coloana UserAgent e NVARCHAR(500); taiem in loc sa aruncam.</summary>
    private const int MaxUserAgentLength = 500;

    public async Task LogAsync(
        string eventType,
        bool succeeded,
        Guid? userId = null,
        Guid? clinicId = null,
        string? emailAttempted = null,
        string? details = null,
        CancellationToken ct = default)
    {
        try
        {
            var userAgent = requestContext.UserAgent;
            if (userAgent is { Length: > MaxUserAgentLength })
                userAgent = userAgent[..MaxUserAgentLength];

            using var connection = context.CreateConnection();
            await connection.ExecuteAsync(
                new CommandDefinition(
                    SecurityEventProcedures.Create,
                    new
                    {
                        EventType = eventType,
                        UserId = userId,
                        ClinicId = clinicId,
                        EmailAttempted = emailAttempted,
                        IpAddress = requestContext.IpAddress,
                        UserAgent = userAgent,
                        Succeeded = succeeded,
                        Details = details
                    },
                    commandType: CommandType.StoredProcedure,
                    cancellationToken: ct));
        }
        catch (Exception ex)
        {
            // Jurnalizarea nu are voie sa blocheze autentificarea. Pierderea unei
            // inregistrari e rea, dar refuzul unui login legitim e mai rau.
            logger.LogError(ex,
                "Nu s-a putut inregistra evenimentul de securitate {EventType}.", eventType);
        }
    }

    public async Task<int> DeleteOlderThanAsync(int retentionDays, CancellationToken ct = default)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                SecurityEventProcedures.DeleteOld,
                new { RetentionDays = retentionDays },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
