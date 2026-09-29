namespace ValyanClinic.Application.Features.Tariffs.DTOs;

public sealed record MedicalServiceDetailDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public Guid CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public int? DurationMinutes { get; init; }
    public Guid? InvestigationTypeId { get; init; }
    public string? InvestigationTypeName { get; init; }
    public bool IsActive { get; init; }
    /// <summary>Base64 — se trimite înapoi la update pentru concurență optimistă.</summary>
    public byte[] RowVersion { get; init; } = [];
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public decimal? CurrentPrice { get; init; }
    public Guid? CurrentVatRateId { get; init; }
    public string? CurrentVatRateName { get; init; }
    public IReadOnlyList<MedicalServicePriceDto> Prices { get; init; } = [];
}
