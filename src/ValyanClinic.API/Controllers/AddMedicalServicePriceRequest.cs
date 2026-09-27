namespace ValyanClinic.API.Controllers;

public sealed record AddMedicalServicePriceRequest(decimal Price, Guid VatRateId, DateOnly ValidFrom);
