namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Medicament trimis la crearea / actualizarea unei rețete.
/// CopaymentListType NULL = necompensat (ajunge pe rețeta simplă).
/// </summary>
public sealed record PrescriptionItemData(
    Guid? ConsultationMedicationId,
    string? DrugCode,
    string? DrugName,
    string? CopaymentListType,
    string? DiagnosisCode,
    decimal? DoseMorning,
    decimal? DoseAfternoon,
    decimal? DoseEvening,
    int? DurationDays,
    decimal? Quantity,
    string? Instructions);
