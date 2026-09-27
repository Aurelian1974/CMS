namespace ValyanClinic.Application.Common.Interfaces;

public sealed record VatRateData(
    string Name,
    decimal Percent,
    string UblCategoryCode,
    string? ExemptionReasonCode,
    string? ExemptionReasonText);
