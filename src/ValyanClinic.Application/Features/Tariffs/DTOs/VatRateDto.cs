namespace ValyanClinic.Application.Features.Tariffs.DTOs;

public sealed class VatRateDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public decimal Percent { get; init; }
    public string UblCategoryCode { get; init; } = string.Empty;
    public string? ExemptionReasonCode { get; init; }
    public string? ExemptionReasonText { get; init; }
    public int SortOrder { get; init; }
    public bool IsActive { get; init; } = true;
    /// <summary>Grupa TVA a casei de marcat mapată pentru clinica curentă (doar la administrare).</summary>
    public string? FiscalTaxGroup { get; init; }
}
