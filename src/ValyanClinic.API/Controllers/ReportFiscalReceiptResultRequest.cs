namespace ValyanClinic.API.Controllers;

public sealed record ReportFiscalReceiptResultRequest(
    string StatusCode,
    string? ReceiptNumber,
    string? DeviceSerialNumber,
    DateTime? PrintedAt,
    string? ErrorMessage,
    string? DeviceResponse);
