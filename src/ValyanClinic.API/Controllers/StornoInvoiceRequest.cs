namespace ValyanClinic.API.Controllers;

public sealed record StornoInvoiceRequest(Guid IdempotencyKey, string Reason);
