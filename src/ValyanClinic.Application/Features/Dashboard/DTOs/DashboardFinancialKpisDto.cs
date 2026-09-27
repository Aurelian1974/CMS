namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardFinancialKpisDto
{
    public decimal? RevenueToday { get; init; }
    public decimal? RevenueThisMonth { get; init; }
    public int? InvoicesThisMonthCount { get; init; }
    public decimal? InvoicesThisMonthNetTotal { get; init; }
    public int? UnpaidCount { get; init; }
    public int? PartialCount { get; init; }
    public decimal? OutstandingTotal { get; init; }
    public int? ReceiptsNeedingAttentionCount { get; init; }
}
