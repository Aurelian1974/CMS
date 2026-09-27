namespace ValyanClinic.Application.Features.Billing.DTOs;

public sealed class BillingStatsDto
{
    public int UnpaidCount { get; init; }
    public int PartialCount { get; init; }
    public int PaidCount { get; init; }
    /// <summary>Bonuri în așteptare / eșuate / cu stare necunoscută — necesită acțiunea recepției.</summary>
    public int ReceiptsNeedingAttentionCount { get; init; }
}
