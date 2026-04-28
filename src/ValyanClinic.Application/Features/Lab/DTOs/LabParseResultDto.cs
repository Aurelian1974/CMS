namespace ValyanClinic.Application.Features.Lab.DTOs;

/// <summary>Rezultatul parsării unui buletin de analize PDF.</summary>
public sealed record LabParseResultDto
{
    public string? Laboratory { get; init; }
    public string? BulletinNumber { get; init; }
    public DateTime? CollectionDate { get; init; }
    public DateTime? ResultDate { get; init; }
    public string? PatientName { get; init; }
    public string? Doctor { get; init; }
    public IReadOnlyList<LabResultRowDto> Results { get; init; } = Array.Empty<LabResultRowDto>();
    public string? RawText { get; init; }
    public bool IsScannedPdf { get; init; }
    public string? ParseWarning { get; init; }
}

/// <summary>Un singur rând de rezultat din buletin.</summary>
public sealed record LabResultRowDto
{
    public string Section { get; init; } = string.Empty;     // HEMATOLOGIE / BIOCHIMIE etc.
    public string TestName { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;       // string ca să suporte NEGATIV/POZITIV
    public string? Unit { get; init; }
    public string? ReferenceRange { get; init; }             // raw text "12.0 - 16.0" / "< 5.7"
    public decimal? RefMin { get; init; }
    public decimal? RefMax { get; init; }
    public string? Flag { get; init; }                       // null / HIGH / LOW / CHECK
    public string? Method { get; init; }
    public string? Notes { get; init; }
}
