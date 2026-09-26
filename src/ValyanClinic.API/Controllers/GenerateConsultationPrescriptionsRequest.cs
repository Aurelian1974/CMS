namespace ValyanClinic.API.Controllers;

public sealed record GenerateConsultationPrescriptionsRequest(
    Guid? CareTypeId,
    Guid? InsuredCategoryId,
    int? TreatmentDays);
