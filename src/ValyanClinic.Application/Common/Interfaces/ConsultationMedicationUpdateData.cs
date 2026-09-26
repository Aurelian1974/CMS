namespace ValyanClinic.Application.Common.Interfaces;

public sealed record ConsultationMedicationUpdateData(
    Guid Id,
    Guid ClinicId,
    string? CopaymentListType,
    decimal? DoseMorning,
    decimal? DoseAfternoon,
    decimal? DoseEvening,
    int? DurationDays,
    string? Notes);
