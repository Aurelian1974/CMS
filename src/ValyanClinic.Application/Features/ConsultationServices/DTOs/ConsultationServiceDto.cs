namespace ValyanClinic.Application.Features.ConsultationServices.DTOs;

/// <summary>Linie de serviciu pe consultație — preț și TVA în snapshot.</summary>
public sealed class ConsultationServiceDto
{
    public Guid Id { get; init; }
    public Guid ConsultationId { get; init; }
    public Guid MedicalServiceId { get; init; }
    public string ServiceCode { get; init; } = string.Empty;
    public string ServiceName { get; init; } = string.Empty;
    public string CategoryName { get; init; } = string.Empty;
    public decimal UnitPrice { get; init; }
    public decimal Quantity { get; init; }
    public decimal LineTotal { get; init; }
    public Guid VatRateId { get; init; }
    public decimal VatPercent { get; init; }
    public string VatCategoryCode { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public DateTime CreatedAt { get; init; }
}
