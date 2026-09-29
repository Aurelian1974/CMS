namespace ValyanClinic.Application.Features.Tariffs.DTOs;

/// <summary>Rând din nomenclatorul de tarife, cu prețul în vigoare azi.</summary>
public sealed class MedicalServiceListDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public Guid CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public string CategoryCode { get; init; } = string.Empty;
    public int? DurationMinutes { get; init; }
    public Guid? InvestigationTypeId { get; init; }
    public bool IsActive { get; init; }
    public decimal? CurrentPrice { get; init; }
    public Guid? CurrentVatRateId { get; init; }
    public string? CurrentVatRateName { get; init; }
    public decimal? CurrentVatPercent { get; init; }
    public DateOnly? CurrentValidFrom { get; init; }
    public decimal? NextPrice { get; init; }
    public DateOnly? NextValidFrom { get; init; }
}
