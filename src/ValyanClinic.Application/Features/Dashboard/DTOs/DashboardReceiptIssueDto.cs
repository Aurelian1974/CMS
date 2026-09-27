namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardReceiptIssueDto
{
    public Guid Id { get; init; }
    public Guid ConsultationId { get; init; }
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public string PatientName { get; init; } = string.Empty;
}
