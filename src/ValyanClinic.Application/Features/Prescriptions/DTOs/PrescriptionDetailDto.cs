namespace ValyanClinic.Application.Features.Prescriptions.DTOs;

/// <summary>Rețeta completă: antet (unitate, pacient, medic) + medicamente.</summary>
public sealed record PrescriptionDetailDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string ClinicName { get; init; } = string.Empty;
    public string? ClinicFiscalCode { get; init; }
    public string? ClinicCnasContract { get; init; }
    public string? ClinicAddress { get; init; }
    public string? ClinicPhone { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string? PatientCnp { get; init; }
    public DateOnly? PatientBirthDate { get; init; }
    public string? PatientGender { get; init; }
    public string? PatientAddress { get; init; }
    public bool PatientIsInsured { get; init; }
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string? DoctorMedicalCode { get; init; }
    public string? DoctorSpecialty { get; init; }
    public Guid? ConsultationId { get; init; }
    public DateTime? ConsultationDate { get; init; }
    public Guid PrescriptionTypeId { get; init; }
    public string TypeCode { get; init; } = string.Empty;
    public string TypeName { get; init; } = string.Empty;
    public bool IsCnas { get; init; }
    public Guid StatusId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public Guid? CareTypeId { get; init; }
    public string? CareTypeCode { get; init; }
    public string? CareTypeName { get; init; }
    public int? CareTypeMaxDays { get; init; }
    public Guid? InsuredCategoryId { get; init; }
    public string? InsuredCategoryName { get; init; }
    public string? NhpCode { get; init; }
    public string? NhpName { get; init; }
    public string? Series { get; init; }
    public int? Number { get; init; }
    public DateTime? IssueDate { get; init; }
    public DateOnly? ValidUntil { get; init; }
    public bool IsExpired { get; init; }
    public int? TreatmentDays { get; init; }
    public string? Diagnostic { get; init; }
    public string? DiagnosticCodes { get; init; }
    public string? RegistryNumber { get; init; }
    public bool IsContinuation { get; init; }
    public string? ReferralLetterNumber { get; init; }
    public string? Notes { get; init; }
    public string? ElectronicId { get; init; }
    public bool IsOffline { get; init; }
    public DateTime? TransmittedAt { get; init; }
    public string? TransmissionError { get; init; }
    public string? CancelReason { get; init; }
    public DateTime? CancelledAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public IReadOnlyList<PrescriptionItemDto> Items { get; init; } = [];
}
