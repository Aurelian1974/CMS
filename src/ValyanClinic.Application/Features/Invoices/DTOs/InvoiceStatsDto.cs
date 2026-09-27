namespace ValyanClinic.Application.Features.Invoices.DTOs;

public sealed class InvoiceStatsDto
{
    public int TotalCount { get; init; }
    public int StornoCount { get; init; }
    /// <summary>Valoarea netă a perioadei (facturile storno au valori negative).</summary>
    public decimal NetTotalValue { get; init; }
}
