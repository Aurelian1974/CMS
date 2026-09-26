namespace ValyanClinic.Application.Features.Prescriptions.DTOs;

/// <summary>Rând din lista de rețete (compensate și simple).</summary>
public sealed class PrescriptionListDto
{
    public Guid Id { get; init; }
    public string? Series { get; init; }
    public int? Number { get; init; }
    public DateTime? IssueDate { get; init; }
    public DateTime CreatedAt { get; init; }
    public Guid PrescriptionTypeId { get; init; }
    public string TypeCode { get; init; } = string.Empty;
    public string TypeName { get; init; } = string.Empty;
    public bool IsCnas { get; init; }
    public Guid StatusId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string? PatientCnp { get; init; }
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public Guid? ConsultationId { get; init; }
    public string? CareTypeName { get; init; }
    public int? TreatmentDays { get; init; }
    public string? Diagnostic { get; init; }
    public string? DiagnosticCodes { get; init; }
    public string? NhpCode { get; init; }
    public DateOnly? ValidUntil { get; init; }
    public bool IsExpired { get; init; }
    public string? ElectronicId { get; init; }
    public int ItemCount { get; init; }
}
