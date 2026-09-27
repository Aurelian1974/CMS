namespace ValyanClinic.API.Controllers;

public sealed record AddBillingServiceRequest(Guid MedicalServiceId, decimal Quantity = 1);
