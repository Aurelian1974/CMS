using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.SecurityEvents.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Interogarea paginata a jurnalului de securitate.</summary>
public sealed class SecurityEventRepository(DapperContext context) : ISecurityEventRepository
{
    public async Task<SecurityEventPagedResult> GetPagedAsync(
        string? eventType,
        Guid? userId,
        string? emailAttempted,
        string? ipAddress,
        bool? succeeded,
        DateTime? dateFrom,
        DateTime? dateTo,
        int page,
        int pageSize,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();

        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                SecurityEventProcedures.GetPaged,
                new
                {
                    EventType = eventType,
                    UserId = userId,
                    EmailAttempted = emailAttempted,
                    IpAddress = ipAddress,
                    Succeeded = succeeded,
                    DateFrom = dateFrom,
                    DateTo = dateTo,
                    Page = page,
                    PageSize = pageSize
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var totalCount = await multi.ReadFirstAsync<int>();
        var items = (await multi.ReadAsync<SecurityEventDto>()).ToList();

        return new SecurityEventPagedResult
        {
            Items = items,
            TotalCount = totalCount,
            Page = page < 1 ? 1 : page,
            PageSize = items.Count > 0 || pageSize > 0 ? pageSize : 50,
        };
    }
}
