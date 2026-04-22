namespace ValyanClinic.Application.Features.Consultations.DTOs;

/// <summary>DTO pentru listare consultații într-un grid paginat.</summary>
public sealed class ConsultationListDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string? PatientPhone { get; init; }
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string? SpecialtyName { get; init; }
    public DateTime Date { get; init; }
    public string? Diagnostic { get; init; }
    public string? DiagnosticCodes { get; init; }
    public Guid StatusId { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public string StatusCode { get; init; } = string.Empty;
    public bool IsDeleted { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? CreatedByName { get; init; }
}
