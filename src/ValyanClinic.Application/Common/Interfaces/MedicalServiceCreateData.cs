namespace ValyanClinic.Application.Common.Interfaces;

public sealed record MedicalServiceCreateData(
    Guid ClinicId,
    string Code,
    string Name,
    Guid CategoryId,
    int? DurationMinutes,
    Guid? InvestigationTypeId,
    decimal Price,
    Guid VatRateId,
    DateOnly? ValidFrom);
