namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardOpenConsultationDto
{
    public Guid Id { get; init; }
    public DateTime Date { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    /// <summary>Rezumat: cod ICD-10 principal + denumire, sau text liber trunchiat.</summary>
    public string? Diagnostic { get; init; }
    /// <summary>HTML din editorul de anamneză, trunchiat.</summary>
    public string? Motiv { get; init; }
    public int DaysOpen { get; init; }
}
