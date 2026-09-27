namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardUnpaidItemDto
{
    public Guid ConsultationId { get; init; }
    public DateTime Date { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public decimal Total { get; init; }
    public decimal Paid { get; init; }
    public decimal Balance { get; init; }
    public string PaymentStatus { get; init; } = string.Empty;
}
