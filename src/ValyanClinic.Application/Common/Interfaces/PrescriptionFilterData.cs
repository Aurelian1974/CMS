namespace ValyanClinic.Application.Common.Interfaces;

public sealed record PrescriptionFilterData(
    string? Search,
    Guid? PrescriptionTypeId,
    Guid? StatusId,
    Guid? DoctorId,
    Guid? PatientId,
    DateTime? DateFrom,
    DateTime? DateTo,
    int Page,
    int PageSize,
    string SortBy,
    string SortDir);
