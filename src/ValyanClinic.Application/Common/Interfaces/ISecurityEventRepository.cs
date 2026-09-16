using ValyanClinic.Application.Features.SecurityEvents.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Citirea jurnalului de securitate. Separat de ISecurityEventLogger, care doar
/// scrie: scrierea se face pe caile de autentificare si nu are voie sa esueze,
/// citirea e o interogare administrativa obisnuita.
/// </summary>
public interface ISecurityEventRepository
{
    Task<SecurityEventPagedResult> GetPagedAsync(
        string? eventType,
        Guid? userId,
        string? emailAttempted,
        string? ipAddress,
        bool? succeeded,
        DateTime? dateFrom,
        DateTime? dateTo,
        int page,
        int pageSize,
        CancellationToken ct);
}
