namespace ValyanClinic.API.Controllers;

public sealed record UpdateMedicalServiceRequest(
    string Code,
    string Name,
    Guid CategoryId,
    int? DurationMinutes,
    Guid? InvestigationTypeId,
    byte[] RowVersion);
