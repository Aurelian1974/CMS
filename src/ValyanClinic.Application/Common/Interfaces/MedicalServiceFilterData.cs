namespace ValyanClinic.Application.Common.Interfaces;

public sealed record MedicalServiceFilterData(
    string? Search,
    Guid? CategoryId,
    bool? IsActive,
    int Page,
    int PageSize,
    string SortBy,
    string SortDir);
