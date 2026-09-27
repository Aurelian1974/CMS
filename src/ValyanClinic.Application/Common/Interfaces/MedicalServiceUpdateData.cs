namespace ValyanClinic.Application.Common.Interfaces;

public sealed record MedicalServiceUpdateData(
    Guid Id,
    Guid ClinicId,
    string Code,
    string Name,
    Guid CategoryId,
    int? DurationMinutes,
    string? InvestigationTypeCode,
    byte[] RowVersion);
