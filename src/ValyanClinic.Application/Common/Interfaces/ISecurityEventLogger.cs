namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Jurnalizeaza evenimentele de autentificare in tabela SecurityEvents.
///
/// Implementarea completeaza singura adresa IP si user agent-ul din cererea
/// curenta si nu propaga niciodata exceptii: un esec de jurnalizare se logheaza,
/// dar nu trebuie sa impiedice un utilizator legitim sa se autentifice.
/// </summary>
public interface ISecurityEventLogger
{
    Task LogAsync(
        string eventType,
        bool succeeded,
        Guid? userId = null,
        Guid? clinicId = null,
        string? emailAttempted = null,
        string? details = null,
        CancellationToken ct = default);

    /// <summary>Sterge evenimentele mai vechi decat perioada de retentie.</summary>
    Task<int> DeleteOlderThanAsync(int retentionDays, CancellationToken ct = default);
}

/// <summary>
/// Datele cererii HTTP curente necesare jurnalizarii. Abstractizate pentru ca
/// handlerele din Application sa nu depinda de HttpContext.
/// </summary>
public interface IRequestContext
{
    string? IpAddress { get; }
    string? UserAgent { get; }
}
