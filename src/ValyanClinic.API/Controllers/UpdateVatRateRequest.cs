namespace ValyanClinic.API.Controllers;

public sealed record UpdateVatRateRequest(
    string Name,
    decimal Percent,
    string UblCategoryCode,
    string? ExemptionReasonCode,
    string? ExemptionReasonText,
    bool IsActive);
