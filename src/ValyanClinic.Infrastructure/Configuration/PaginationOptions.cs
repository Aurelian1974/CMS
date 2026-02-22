namespace ValyanClinic.Infrastructure.Configuration;

/// <summary>
/// Opțiuni pentru paginarea server-side.
/// </summary>
public sealed class PaginationOptions
{
    public const string SectionName = "Pagination";

    public int DefaultPageSize { get; init; } = 20;
    public int MaxPageSize     { get; init; } = 100;
}
