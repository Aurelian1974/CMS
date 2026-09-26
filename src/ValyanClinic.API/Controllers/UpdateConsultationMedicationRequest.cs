namespace ValyanClinic.API.Controllers;

public sealed record UpdateConsultationMedicationRequest(
    string? CopaymentListType,
    decimal? DoseMorning,
    decimal? DoseAfternoon,
    decimal? DoseEvening,
    int? DurationDays,
    string? Notes);
