namespace ValyanClinic.API.Controllers;

public sealed record ReconcileFiscalReceiptRequest(bool WasPrinted, string? ReceiptNumber, string? Note);
