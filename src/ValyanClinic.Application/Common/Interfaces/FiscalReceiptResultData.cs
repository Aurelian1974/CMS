namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Rezultatul raportat de fiscal bridge pentru un job de tipărire.</summary>
public sealed record FiscalReceiptResultData(
    Guid Id,
    Guid ClinicId,
    string StatusCode,
    string? ReceiptNumber,
    string? DeviceSerialNumber,
    DateTime? PrintedAt,
    string? ErrorMessage,
    string? DeviceResponse);
