namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardFinancialDto
{
    public DashboardFinancialKpisDto? Kpis { get; init; }
    public IReadOnlyList<DashboardUnpaidItemDto>? Unpaid { get; init; }
    public IReadOnlyList<DashboardReceiptIssueDto>? ReceiptIssues { get; init; }
}
