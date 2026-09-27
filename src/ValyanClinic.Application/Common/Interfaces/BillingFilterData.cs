namespace ValyanClinic.Application.Common.Interfaces;

public sealed record BillingFilterData(
    string? Search,
    string? PaymentStatus,
    DateOnly? DateFrom,
    DateOnly? DateTo,
    int Page,
    int PageSize);
