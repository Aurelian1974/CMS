namespace ValyanClinic.Application.Common.Models;

/// <summary>
/// Rezultatul paginat pentru operații de listare.
/// </summary>
public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }
    public int TotalCount { get; }
    public int Page { get; }
    public int PageSize { get; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;

    public PagedResult(IEnumerable<T> items, int totalCount, int page, int pageSize)
    {
        Items = items.ToList().AsReadOnly();
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }
}
