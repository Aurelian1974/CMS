namespace ValyanClinic.Application.Common.Interfaces;

public sealed record InvoiceFilterData(
    string? Search,
    Guid? StatusId,
    DateOnly? DateFrom,
    DateOnly? DateTo,
    int Page,
    int PageSize,
    string SortBy,
    string SortDir);
