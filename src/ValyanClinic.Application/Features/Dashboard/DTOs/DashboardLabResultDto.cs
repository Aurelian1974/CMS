namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardLabResultDto
{
    public Guid Id { get; init; }
    public DateOnly? ResultDate { get; init; }
    public DateOnly? CollectionDate { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string? Laboratory { get; init; }
    public string? BulletinNumber { get; init; }
    public Guid? ConsultationId { get; init; }
    public int AbnormalCount { get; init; }
}
