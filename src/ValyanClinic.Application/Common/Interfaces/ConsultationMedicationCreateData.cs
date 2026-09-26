namespace ValyanClinic.Application.Common.Interfaces;

public sealed record ConsultationMedicationCreateData(
    Guid ClinicId,
    Guid ConsultationId,
    string DrugCode,
    string? CopaymentListType,
    decimal? DoseMorning,
    decimal? DoseAfternoon,
    decimal? DoseEvening,
    int? DurationDays,
    string? Notes);
